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
import { type DragEvent, useState } from "react";
import { allClustersGroupId, clusterGroupsInjectable } from "../cluster-groups.injectable";
import { byClusterName, clusterRecordsInjectable } from "../cluster-records.injectable";
import { connectClustersInjectable } from "../connect-clusters.injectable";
import { groupFlowsInjectable } from "../group-flows.injectable";
import { clusterDragContext, clusterDragInjectable } from "./cluster-drag.injectable";
import { type ClusterGroupItem, clusterGroupKind, clusterGroupsRootKind } from "./kinds";
import { RowActionButton, RowActions, RowActionStatus } from "./row-action";

const ClusterGroupRow = observer(({ kind, ids, item }: NavigatorItemProps<ClusterGroupItem, typeof clusterGroupsRootKind>) => {
  const isOpen = useItemIsOpen(kind, ...ids);
  const hasChildren = useItemHasChildren(kind, ...ids);
  const drillDown = useItemDrillDown(kind, ...ids);
  const flows = useInject(groupFlowsInjectable)();
  const connectClusters = useInject(connectClustersInjectable)();
  const clusterDrag = useInject(clusterDragInjectable)();
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const isDropTarget = isDraggedOver && clusterDrag.canDropOn(item.id);

  // Entering a child of the label leaves the label too, which is not leaving it for the user.
  const draggedOverWhen = (isOver: boolean) => (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggedOver(isOver);
    }
  };

  const total = item.members.length;
  const connected = item.members.filter((member) => member.isConnected.get()).length;
  const isConnecting = item.members.some((member) => connectClusters.isConnecting(member.id));
  const allConnected = total > 0 && connected === total;

  return (
    <>
      {hasChildren && total > 0 ? <NavigatorBranchIndicator isOpen={isOpen} /> : <NavigatorLeafIndicator />}
      <NavigatorItemIcon>{item.isAllClusters ? <LayersIcon $size="m" /> : <FolderIcon $size="m" />}</NavigatorItemIcon>
      <NavigatorItemLabel
        $tooltip={`${item.name}: ${connected} of ${total} connected`}
        $droppable={clusterDragContext.droppable((cluster) => {
          setIsDraggedOver(false);
          void clusterDrag.drop(cluster, item.id);
        })}
        onDragEnter={draggedOverWhen(true)}
        onDragLeave={draggedOverWhen(false)}
        $color={isDropTarget ? "primary" : undefined}
        $backgroundColor={isDropTarget ? "backgroundPrimaryDimmed" : undefined}
        $border={isDropTarget ? { radius: "s" } : undefined}
      >
        {item.name}
      </NavigatorItemLabel>
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

