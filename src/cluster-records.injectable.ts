import { allClusterRecordsReactiveInjectionToken, type ClusterRecord } from "@k8slens/cluster-contracts";
import { getInjectable2 } from "@k8slens/injectable";
import { computed, type IComputedValue, observable, runInAction } from "mobx";

export interface ClusterRecordsState {
  /** Every cluster Lens knows, empty until Lens has told us about them. */
  readonly all: IComputedValue<ClusterRecord[]>;
  readonly byId: IComputedValue<ReadonlyMap<string, ClusterRecord>>;
  /** Resolves with the live list once Lens knows the user's clusters. */
  readonly loaded: Promise<IComputedValue<ClusterRecord[]>>;
}

// Holds the user's clusters synchronously, so rows and modals can render them without suspending.
export const clusterRecordsInjectable = getInjectable2({
  id: "cluster-groups-cluster-records",
  consumptions: [allClusterRecordsReactiveInjectionToken],

  instantiate: (di) => {
    const source = observable.box<IComputedValue<ClusterRecord[]> | undefined>(undefined, { deep: false });
    const loaded = di.inject(allClusterRecordsReactiveInjectionToken)();

    void loaded.then((records) => runInAction(() => source.set(records)));

    const all = computed(() => source.get()?.get() ?? []);
    const byId = computed(() => new Map(all.get().map((record) => [record.id, record])));
    const state: ClusterRecordsState = { all, byId, loaded };

    return () => state;
  },
});

export const byClusterName = (left: ClusterRecord, right: ClusterRecord) =>
  left.name.get().localeCompare(right.name.get(), undefined, { sensitivity: "base", numeric: true });
