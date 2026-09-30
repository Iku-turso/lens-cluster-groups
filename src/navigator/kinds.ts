import type { ClusterRecord } from "@k8slens/cluster-contracts";
import { getNavigatorItemKind } from "@k8slens/navigator-contracts";

export interface ClusterGroupsRootItem {
  readonly id: string;
  readonly name: string;
}

export interface ClusterGroupItem {
  readonly id: string;
  readonly name: string;
  readonly orderNumber: number;
  readonly isAllClusters: boolean;
  /** The group's clusters that Lens still knows. */
  readonly members: readonly ClusterRecord[];
}

export interface ClusterGroupMemberItem {
  readonly id: string;
  readonly name: string;
  readonly record: ClusterRecord;
}

export const clusterGroupsRootId = "cluster-groups";

/** The one "Cluster Groups" branch at the top of the navigator. */
export const clusterGroupsRootKind = getNavigatorItemKind<ClusterGroupsRootItem, []>()("cluster-groups-root");

/** "All clusters" and every group of the user's own, under the branch. */
export const clusterGroupKind = getNavigatorItemKind<ClusterGroupItem, [rootId: string]>()("cluster-group");

/** A cluster inside a group. */
export const clusterGroupMemberKind = getNavigatorItemKind<ClusterGroupMemberItem, [rootId: string, groupId: string]>()(
  "cluster-group-member",
);
