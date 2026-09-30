import { getInjectable2 } from "@k8slens/injectable";
import { getPersistableArrayInjectableBunch } from "@k8slens/persistable-contracts";
import { action, computed, type IComputedValue, type IObservableArray, observable, runInAction } from "mobx";

export interface ClusterGroup {
  readonly id: string;
  readonly name: string;
  readonly clusterIds: readonly string[];
}

export interface ClusterGroupDraft {
  readonly name: string;
  readonly clusterIds: readonly string[];
}

/** The id of the built-in group that holds every cluster. No stored group ever has it. */
export const allClustersGroupId = "all";

export const clusterGroupsPersistableBunch = getPersistableArrayInjectableBunch<ClusterGroup>()({
  id: "cluster-groups",
});

export interface ClusterGroups {
  /** The user's own groups, in the order they made them; empty until they have been read from disk. */
  readonly all: IComputedValue<readonly ClusterGroup[]>;
  readonly byId: IComputedValue<ReadonlyMap<string, ClusterGroup>>;
  readonly create: (draft: ClusterGroupDraft) => Promise<ClusterGroup>;
  readonly update: (groupId: string, draft: ClusterGroupDraft) => Promise<void>;
  readonly remove: (groupId: string) => Promise<void>;
  readonly removeCluster: (groupId: string, clusterId: string) => Promise<void>;
  /** Puts the cluster in exactly the given groups, taking it out of every other one. */
  readonly setGroupsOfCluster: (clusterId: string, groupIds: readonly string[]) => Promise<void>;
}

const newGroupId = () => `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const unique = (ids: readonly string[]) => [...new Set(ids)];

export const clusterGroupsInjectable = getInjectable2({
  id: "cluster-groups-state",

  instantiate: (di) => {
    const stored = observable.box<IObservableArray<ClusterGroup> | undefined>(undefined, { deep: false });
    const loaded = di.inject(clusterGroupsPersistableBunch.persistable)().then((groups) => {
      runInAction(() => stored.set(groups));

      return groups;
    });

    const all = computed((): readonly ClusterGroup[] => stored.get()?.slice() ?? []);
    const byId = computed(() => new Map(all.get().map((group) => [group.id, group])));

    // The persisted array is shallow, so a group is changed by replacing it, never by mutating it.
    const replace = async (groupId: string, change: (group: ClusterGroup) => ClusterGroup) => {
      const groups = await loaded;

      action(() => {
        const index = groups.findIndex((group) => group.id === groupId);

        if (index >= 0) {
          groups[index] = change(groups[index]);
        }
      })();
    };

    const clusterGroups: ClusterGroups = {
      all,
      byId,

      create: async (draft) => {
        const groups = await loaded;
        const group: ClusterGroup = { id: newGroupId(), name: draft.name.trim(), clusterIds: unique(draft.clusterIds) };

        action(() => groups.push(group))();

        return group;
      },

      update: (groupId, draft) =>
        replace(groupId, (group) => ({ ...group, name: draft.name.trim(), clusterIds: unique(draft.clusterIds) })),

      remove: async (groupId) => {
        const groups = await loaded;

        action(() => {
          const index = groups.findIndex((group) => group.id === groupId);

          if (index >= 0) {
            groups.splice(index, 1);
          }
        })();
      },

      removeCluster: (groupId, clusterId) =>
        replace(groupId, (group) => ({ ...group, clusterIds: group.clusterIds.filter((id) => id !== clusterId) })),

      setGroupsOfCluster: async (clusterId, groupIds) => {
        const groups = await loaded;
        const wanted = new Set(groupIds);

        action(() => {
          groups.forEach((group, index) => {
            const isIn = group.clusterIds.includes(clusterId);
            const shouldBeIn = wanted.has(group.id);

            if (isIn !== shouldBeIn) {
              groups[index] = {
                ...group,
                clusterIds: shouldBeIn ? [...group.clusterIds, clusterId] : group.clusterIds.filter((id) => id !== clusterId),
              };
            }
          });
        })();
      },
    };

    return () => clusterGroups;
  },
});
