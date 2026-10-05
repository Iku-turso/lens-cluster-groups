import { getDraggableContext } from "@k8slens/element-components";
import { getInjectable2 } from "@k8slens/injectable";
import { action, observable } from "mobx";
import { allClustersGroupId, clusterGroupsInjectable } from "../cluster-groups.injectable";

export interface DraggedCluster {
  readonly clusterId: string;
  /** The group the cluster was picked up from, All clusters included. */
  readonly fromGroupId: string;
}

/** Carries a cluster from its row in one group to the row of another. */
export const clusterDragContext = getDraggableContext<DraggedCluster>();

export interface ClusterDrag {
  readonly start: (cluster: DraggedCluster) => void;
  readonly end: () => void;
  /** Whether the cluster being dragged, if any, may be dropped on the group. */
  readonly canDropOn: (groupId: string) => boolean;
  /** Out of one of the user's groups it moves; out of All clusters it is added. */
  readonly drop: (cluster: DraggedCluster, groupId: string) => Promise<void>;
}

export const clusterDragInjectable = getInjectable2({
  id: "cluster-groups-cluster-drag",

  instantiate: (di) => {
    const clusterGroups = di.inject(clusterGroupsInjectable)();
    const dragged = observable.box<DraggedCluster | undefined>(undefined, { deep: false });

    const canDrop = (cluster: DraggedCluster | undefined, groupId: string) => {
      if (!cluster || groupId === allClustersGroupId || groupId === cluster.fromGroupId) {
        return false;
      }

      // Out of All clusters a cluster is only added, so a group that has it already has nothing to gain.
      const isInTarget = clusterGroups.byId.get().get(groupId)?.clusterIds.includes(cluster.clusterId) ?? false;

      return cluster.fromGroupId !== allClustersGroupId || !isInTarget;
    };

    const clusterDrag: ClusterDrag = {
      start: action((cluster: DraggedCluster) => dragged.set(cluster)),
      end: action(() => dragged.set(undefined)),
      canDropOn: (groupId) => canDrop(dragged.get(), groupId),

      drop: async (cluster, groupId) => {
        if (canDrop(cluster, groupId)) {
          await clusterGroups.moveCluster(cluster.clusterId, cluster.fromGroupId, groupId);
        }
      },
    };

    return () => clusterDrag;
  },
});
