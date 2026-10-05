import { Div, Img } from "@k8slens/element-components";
import { CheckCircleIcon, CircleIcon, LinkIcon, SpinnerIcon } from "@k8slens/icon";
import { getNavigatorItemKindInjectableBunch, type NavigatorItemProps } from "@k8slens/navigator-contracts";
import { NavigatorItemIcon, NavigatorItemLabel, NavigatorLeafIndicator } from "@k8slens/navigator-components";
import { useInject } from "@k8slens/use-inject";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { allClustersGroupId, clusterGroupsInjectable } from "../cluster-groups.injectable";
import { byClusterName, clusterRecordsInjectable } from "../cluster-records.injectable";
import { connectClustersInjectable } from "../connect-clusters.injectable";
import { groupFlowsInjectable } from "../group-flows.injectable";
import { clusterDragContext, clusterDragInjectable, type DraggedCluster } from "./cluster-drag.injectable";
import { type ClusterGroupMemberItem, clusterGroupKind, clusterGroupMemberKind } from "./kinds";
import { RowActionButton, RowActions, RowActionStatus } from "./row-action";

const ClusterAvatar = observer(({ item }: { readonly item: ClusterGroupMemberItem }) => {
  const image = item.record.icon.get();

  // Most clusters have no image of their own: a dot in the cluster's colour stands in for one.
  return image ? (
    <Img src={image} alt="" $style={{ width: "16px", height: "16px", borderRadius: "3px" }} />
  ) : (
    <Div $flex={{ verticalAlign: "center" }} $style={{ color: item.record.color.get() || "currentColor" }}>
      <CircleIcon $size="xs" />
    </Div>
  );
});

const ClusterGroupMemberRow = observer(({ ids, item }: NavigatorItemProps<ClusterGroupMemberItem, typeof clusterGroupKind>) => {
  const connectClusters = useInject(connectClustersInjectable)();
  const flows = useInject(groupFlowsInjectable)();
  const clusterDrag = useInject(clusterDragInjectable)();
  const [, groupId] = ids;
  const dragged: DraggedCluster = { clusterId: item.id, fromGroupId: groupId };
  const name = item.record.name.get();
  const isConnected = item.record.isConnected.get();
  const isConnecting = connectClusters.isConnecting(item.id);

  return (
    <>
      <NavigatorLeafIndicator />
      <NavigatorItemIcon>
        <ClusterAvatar item={item} />
      </NavigatorItemIcon>
      <NavigatorItemLabel
        onClick={() => flows.openCluster(item.id)}
        $cursor="pointer"
        $draggable={clusterDragContext.draggable(dragged)}
        onDragStart={() => clusterDrag.start(dragged)}
        onDragEnd={() => clusterDrag.end()}
      >
        {name}
      </NavigatorItemLabel>
      <RowActions>
        {isConnecting ? (
          <RowActionStatus $tooltip="Connecting…">
            <SpinnerIcon $size={{ size: "s", min: "s" }} />
          </RowActionStatus>
        ) : isConnected ? (
          <RowActionStatus $tooltip="Connected">
            <CheckCircleIcon $size={{ size: "s", min: "s" }} />
          </RowActionStatus>
        ) : (
          <RowActionButton $tooltip={`Connect ${name}`} $onClick={() => connectClusters.connect([item.id], name)}>
            <LinkIcon $size={{ size: "s", min: "s" }} />
          </RowActionButton>
        )}
      </RowActions>
    </>
  );
});

export const clusterGroupMemberBunch = getNavigatorItemKindInjectableBunch({
  kind: clusterGroupMemberKind,
  parentKind: clusterGroupKind,
  description: "A cluster inside a cluster group, with its connection state.",

  items: {
    instantiate: (di) => {
      const clusterRecords = di.inject(clusterRecordsInjectable)();
      const clusterGroups = di.inject(clusterGroupsInjectable)();

      return async (_rootId, groupId) =>
        computed((): ClusterGroupMemberItem[] => {
          const byId = clusterRecords.byId.get();
          const records =
            groupId === allClustersGroupId
              ? clusterRecords.all.get()
              : (clusterGroups.byId.get().get(groupId)?.clusterIds ?? [])
                  .map((clusterId) => byId.get(clusterId))
                  .filter((record) => record !== undefined);

          return records
            .slice()
            .sort(byClusterName)
            .map((record) => ({ id: record.id, name: record.name.get(), record }));
        });
    },
  },

  Component: ClusterGroupMemberRow,
});
