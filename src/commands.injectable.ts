import { getCommandInjectableBunch } from "@k8slens/command-palette-contracts";
import { groupFlowsInjectable } from "./group-flows.injectable";

export const connectAllClustersCommand = getCommandInjectableBunch({
  id: "cluster-groups.connect-all-clusters",
  title: "Cluster Groups: Connect all clusters",
  action: {
    instantiate: (di) => {
      const flows = di.inject(groupFlowsInjectable)();

      return () => () => flows.connectAll();
    },
  },
});

export const newClusterGroupCommand = getCommandInjectableBunch({
  id: "cluster-groups.new-cluster-group",
  title: "Cluster Groups: New group",
  action: {
    instantiate: (di) => {
      const flows = di.inject(groupFlowsInjectable)();

      return () => () => flows.createGroup();
    },
  },
});
