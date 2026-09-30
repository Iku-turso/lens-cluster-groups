import { getInjectable2 } from "@k8slens/injectable";
import { navigateToPodsInjectionToken } from "@k8slens/kubernetes-resources-contracts";
import { openModalInjectionToken } from "@k8slens/modal-contracts";
import { isNavigationSupersededError } from "@k8slens/navigation-contracts";
import { showErrorNotificationInjectionToken, showSuccessNotificationInjectionToken } from "@k8slens/notifications-contracts";
import { allClustersGroupId, clusterGroupsInjectable } from "./cluster-groups.injectable";
import { clusterRecordsInjectable } from "./cluster-records.injectable";
import { connectClustersInjectable } from "./connect-clusters.injectable";
import { confirmDeleteGroupModalKind } from "./modals/confirm-delete-group-modal.injectable";
import { groupEditorModalKind } from "./modals/group-editor-modal.injectable";
import { pickGroupsModalKind } from "./modals/pick-groups-modal.injectable";

/** What the user does to groups from the navigator and the command palette, modals included. */
export interface GroupFlows {
  readonly createGroup: (clusterIds?: readonly string[]) => Promise<void>;
  readonly editGroup: (groupId: string) => Promise<void>;
  readonly deleteGroup: (groupId: string) => Promise<void>;
  readonly removeClusterFromGroup: (groupId: string, clusterId: string) => Promise<void>;
  readonly pickGroupsOfCluster: (clusterId: string) => Promise<void>;
  readonly connectGroup: (groupId: string) => Promise<void>;
  readonly connectAll: () => Promise<void>;
  /** Takes the user to the cluster's pods, connecting it first when it is not connected. */
  readonly openCluster: (clusterId: string) => Promise<void>;
}

export const groupFlowsInjectable = getInjectable2({
  id: "cluster-groups-group-flows",
  consumptions: [
    openModalInjectionToken,
    navigateToPodsInjectionToken,
    showSuccessNotificationInjectionToken,
    showErrorNotificationInjectionToken,
  ],

  instantiate: (di) => {
    const openGroupEditor = di.inject(openModalInjectionToken.for(groupEditorModalKind).for(di.scopeIds))();
    const openConfirmDelete = di.inject(openModalInjectionToken.for(confirmDeleteGroupModalKind).for(di.scopeIds))();
    const openPickGroups = di.inject(openModalInjectionToken.for(pickGroupsModalKind).for(di.scopeIds))();
    const navigateToPods = di.inject(navigateToPodsInjectionToken)();
    const showSuccessNotification = di.inject(showSuccessNotificationInjectionToken)();
    const showErrorNotification = di.inject(showErrorNotificationInjectionToken)();
    const clusterGroups = di.inject(clusterGroupsInjectable)();
    const clusterRecords = di.inject(clusterRecordsInjectable)();
    const connectClusters = di.inject(connectClustersInjectable)();

    const groupOf = (groupId: string) => clusterGroups.byId.get().get(groupId);

    const flows: GroupFlows = {
      createGroup: async (clusterIds = []) => {
        const draft = await openGroupEditor("New cluster group", "Create", { name: "", clusterIds });

        if (draft) {
          await clusterGroups.create(draft);
          showSuccessNotification(`Created the cluster group “${draft.name}”.`);
        }
      },

      editGroup: async (groupId) => {
        const group = groupOf(groupId);

        if (!group) {
          return;
        }

        const draft = await openGroupEditor(`Edit “${group.name}”`, "Save", group);

        if (draft) {
          await clusterGroups.update(groupId, draft);
        }
      },

      deleteGroup: async (groupId) => {
        const group = groupOf(groupId);

        if (group && (await openConfirmDelete(group.name))) {
          await clusterGroups.remove(groupId);
        }
      },

      removeClusterFromGroup: (groupId, clusterId) => clusterGroups.removeCluster(groupId, clusterId),

      pickGroupsOfCluster: async (clusterId) => {
        const clusterName = clusterRecords.byId.get().get(clusterId)?.name.get() ?? clusterId;
        const current = clusterGroups.all
          .get()
          .filter((group) => group.clusterIds.includes(clusterId))
          .map((group) => group.id);

        const picked = await openPickGroups(clusterName, current);

        if (!picked) {
          return;
        }

        await clusterGroups.setGroupsOfCluster(clusterId, picked.groupIds);

        if (picked.newGroupName) {
          await clusterGroups.create({ name: picked.newGroupName, clusterIds: [clusterId] });
        }
      },

      connectGroup: async (groupId) => {
        if (groupId === allClustersGroupId) {
          return flows.connectAll();
        }

        const group = groupOf(groupId);

        if (group) {
          await connectClusters.connect(group.clusterIds, `“${group.name}”`);
        }
      },

      connectAll: async () => {
        const records = await clusterRecords.loaded;

        await connectClusters.connect(
          records.get().map((record) => record.id),
          "all clusters",
        );
      },

      openCluster: async (clusterId) => {
        const record = clusterRecords.byId.get().get(clusterId);

        try {
          // Connected here rather than by the navigation, so the row shows it is connecting meanwhile.
          if (record && !record.isConnected.get() && !connectClusters.isConnecting(clusterId)) {
            await connectClusters.connectQuietly(clusterId);
          }

          await navigateToPods({ clusterId, namespaces: "all" });
        } catch (error) {
          // The user went somewhere else before the pods were shown: not a failure.
          if (!isNavigationSupersededError(error)) {
            showErrorNotification(error instanceof Error ? error : new Error(String(error)));
          }
        }
      },
    };

    return () => flows;
  },
});
