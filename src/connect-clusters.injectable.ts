import { connectClusterInjectionToken } from "@k8slens/cluster-contracts";
import { getInjectable2 } from "@k8slens/injectable";
import {
  showErrorNotificationInjectionToken,
  showInfoNotificationInjectionToken,
  showSuccessNotificationInjectionToken,
} from "@k8slens/notifications-contracts";
import { action, observable } from "mobx";
import { clusterRecordsInjectable } from "./cluster-records.injectable";

/** How many clusters are connected at the same time, so a large group does not flood Lens. */
const maxConcurrentConnections = 4;

export interface ConnectClusters {
  /** Connects every cluster of the list that is not connected yet, saying how it went. */
  readonly connect: (clusterIds: readonly string[], whatIsConnected: string) => Promise<void>;
  /** Connects one cluster without notifying, showing it as connecting meanwhile; rejects when it fails. */
  readonly connectQuietly: (clusterId: string) => Promise<void>;
  /** Whether a connection this extension started for the cluster is still under way. */
  readonly isConnecting: (clusterId: string) => boolean;
}

export const connectClustersInjectable = getInjectable2({
  id: "cluster-groups-connect-clusters",
  consumptions: [
    connectClusterInjectionToken,
    showInfoNotificationInjectionToken,
    showSuccessNotificationInjectionToken,
    showErrorNotificationInjectionToken,
  ],

  instantiate: (di) => {
    const connectCluster = di.inject(connectClusterInjectionToken);
    const showInfoNotification = di.inject(showInfoNotificationInjectionToken)();
    const showSuccessNotification = di.inject(showSuccessNotificationInjectionToken)();
    const showErrorNotification = di.inject(showErrorNotificationInjectionToken)();
    const clusterRecords = di.inject(clusterRecordsInjectable)();
    const connecting = observable.set<string>();

    const connectOne = async (clusterId: string) => {
      action(() => connecting.add(clusterId))();

      try {
        await connectCluster(clusterId);
      } finally {
        action(() => connecting.delete(clusterId))();
      }
    };

    const nameOf = (clusterId: string) => clusterRecords.byId.get().get(clusterId)?.name.get() ?? clusterId;

    const connectClusters: ConnectClusters = {
      isConnecting: (clusterId) => connecting.has(clusterId),
      connectQuietly: connectOne,

      connect: async (clusterIds, whatIsConnected) => {
        await clusterRecords.loaded;

        const known = clusterRecords.byId.get();
        const toConnect = [...new Set(clusterIds)].filter((clusterId) => {
          const record = known.get(clusterId);

          return record && !record.isConnected.get() && !connecting.has(clusterId);
        });

        if (toConnect.length === 0) {
          showInfoNotification(`Every cluster in ${whatIsConnected} is already connected.`);

          return;
        }

        const failed: string[] = [];
        const queue = [...toConnect];

        const worker = async () => {
          for (let clusterId = queue.shift(); clusterId; clusterId = queue.shift()) {
            try {
              await connectOne(clusterId);
            } catch {
              failed.push(nameOf(clusterId));
            }
          }
        };

        await Promise.all(Array.from({ length: Math.min(maxConcurrentConnections, toConnect.length) }, worker));

        const succeeded = toConnect.length - failed.length;

        if (failed.length === 0) {
          showSuccessNotification(`Connected ${succeeded} ${plural(succeeded)} in ${whatIsConnected}.`);
        } else {
          showErrorNotification(
            `Connected ${succeeded} of ${toConnect.length} ${plural(toConnect.length)} in ${whatIsConnected}. ` +
              `Could not connect: ${failed.join(", ")}.`,
          );
        }
      },
    };

    return () => connectClusters;
  },
});

const plural = (count: number) => (count === 1 ? "cluster" : "clusters");
