import { Span } from "@k8slens/element-components";
import { FolderIcon, LayersIcon, PlayArrowIcon, SpinnerIcon } from "@k8slens/icon";
import {
  getNavigatorItemKindInjectableBunch,
  type NavigatorItemProps,
  useItemDrillDown,
  useItemHasChildren,
  useItemIsOpen,
} from "@k8slens/navigator-contracts";
import {
  NavigatorBranchIndicator,
  NavigatorDrillDownButton,
  NavigatorItemIcon,
  NavigatorItemLabel,
  NavigatorLeafIndicator,
} from "@k8slens/navigator-components";
import { useInject } from "@k8slens/use-inject";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { allClustersGroupId, clusterGroupsInjectable } from "../cluster-groups.injectable";
import { byClusterName, clusterRecordsInjectable } from "../cluster-records.injectable";
import { connectClustersInjectable } from "../connect-clusters.injectable";
import { groupFlowsInjectable } from "../group-flows.injectable";
import { type ClusterGroupItem, clusterGroupKind, clusterGroupsRootKind } from "./kinds";
import { RowActionButton, RowActions, RowActionStatus } from "./row-action";

const ClusterGroupRow = observer(({ kind, ids, item }: NavigatorItemProps<ClusterGroupItem, typeof clusterGroupsRootKind>) => {
  const isOpen = useItemIsOpen(kind, ...ids);
  const hasChildren = useItemHasChildren(kind, ...ids);
  const drillDown = useItemDrillDown(kind, ...ids);
  const flows = useInject(groupFlowsInjectable)();
  const connectClusters = useInject(connectClustersInjectable)();

  const total = item.members.length;
  const connected = item.members.filter((member) => member.isConnected.get()).length;
  const isConnecting = item.members.some((member) => connectClusters.isConnecting(member.id));
  const allConnected = total > 0 && connected === total;

  return (
    <>
      {hasChildren && total > 0 ? <NavigatorBranchIndicator isOpen={isOpen} /> : <NavigatorLeafIndicator />}
      <NavigatorItemIcon>{item.isAllClusters ? <LayersIcon $size="m" /> : <FolderIcon $size="m" />}</NavigatorItemIcon>
      <NavigatorItemLabel $tooltip={`${item.name}: ${connected} of ${total} connected`}>{item.name}</NavigatorItemLabel>
      <RowActions>
        <Span $font={{ size: "s" }} $style={{ opacity: 0.7, whiteSpace: "nowrap" }}>
          {connected}/{total}
        </Span>
        {isConnecting ? (
          <RowActionStatus $tooltip="Connecting…">
            <SpinnerIcon $size={{ size: "s", min: "s" }} />
          </RowActionStatus>
        ) : (
          <RowActionButton
            $enabled={total > 0 && !allConnected}
            $tooltip={total === 0 ? "No clusters in this group" : allConnected ? "All connected" : `Connect all in ${item.name}`}
            $onClick={() => flows.connectGroup(item.id)}
          >
            <PlayArrowIcon $size={{ size: "s", min: "s" }} />
          </RowActionButton>
        )}
        {total > 0 && <NavigatorDrillDownButton $onClick={drillDown} />}
      </RowActions>
    </>
  );
});

export const clusterGroupBunch = getNavigatorItemKindInjectableBunch({
  kind: clusterGroupKind,
  parentKind: clusterGroupsRootKind,
  description: "A group of clusters, or All clusters, that connects in one click.",

  items: {
    instantiate: (di) => {
      const clusterRecords = di.inject(clusterRecordsInjectable)();
      const clusterGroups = di.inject(clusterGroupsInjectable)();

      return async () =>
        computed((): ClusterGroupItem[] => {
          const all = clusterRecords.all.get().slice().sort(byClusterName);
          const byId = clusterRecords.byId.get();

          return [
            { id: allClustersGroupId, name: "All clusters", orderNumber: 0, isAllClusters: true, members: all },
            ...clusterGroups.all.get().map(
              (group, index): ClusterGroupItem => ({
                id: group.id,
                name: group.name,
                orderNumber: index + 1,
                isAllClusters: false,
                members: group.clusterIds
                  .map((clusterId) => byId.get(clusterId))
                  .filter((record) => record !== undefined)
                  .sort(byClusterName),
              }),
            ),
          ];
        });
    },
  },

  Component: ClusterGroupRow,
});

