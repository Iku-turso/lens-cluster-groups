import { AddIcon, LayersIcon, PlayArrowIcon } from "@k8slens/icon";
import {
  getNavigatorItemKindInjectableBunch,
  type NavigatorItemProps,
  navigatorRootKind,
  useItemDrillDown,
  useItemIsOpen,
} from "@k8slens/navigator-contracts";
import {
  NavigatorBranchIndicator,
  NavigatorDrillDownButton,
  NavigatorItemIcon,
  NavigatorItemLabel,
} from "@k8slens/navigator-components";
import { useInject } from "@k8slens/use-inject";
import { computed } from "mobx";
import { groupFlowsInjectable } from "../group-flows.injectable";
import { type ClusterGroupsRootItem, clusterGroupsRootId, clusterGroupsRootKind } from "./kinds";
import { RowActionButton, RowActions } from "./row-action";

const ClusterGroupsRootRow = ({ kind, ids, item }: NavigatorItemProps<ClusterGroupsRootItem, typeof navigatorRootKind>) => {
  const isOpen = useItemIsOpen(kind, ...ids);
  const drillDown = useItemDrillDown(kind, ...ids);
  const flows = useInject(groupFlowsInjectable)();

  return (
    <>
      <NavigatorBranchIndicator isOpen={isOpen} />
      <NavigatorItemIcon>
        <LayersIcon $size="m" />
      </NavigatorItemIcon>
      <NavigatorItemLabel>{item.name}</NavigatorItemLabel>
      <RowActions>
        <RowActionButton $tooltip="New group" $onClick={() => flows.createGroup()}>
          <AddIcon $size={{ size: "s", min: "s" }} />
        </RowActionButton>
        <RowActionButton $tooltip="Connect all clusters" $onClick={() => flows.connectAll()}>
          <PlayArrowIcon $size={{ size: "s", min: "s" }} />
        </RowActionButton>
        <NavigatorDrillDownButton $onClick={drillDown} />
      </RowActions>
    </>
  );
};

const rootItems = computed((): ClusterGroupsRootItem[] => [{ id: clusterGroupsRootId, name: "Cluster Groups" }]);

export const clusterGroupsRootBunch = getNavigatorItemKindInjectableBunch({
  kind: clusterGroupsRootKind,
  parentKind: navigatorRootKind,
  description: "The Cluster Groups branch at the top of the navigator, holding all clusters and the user's groups of them.",

  items: {
    instantiate: () => async () => rootItems,
  },

  Component: ClusterGroupsRootRow,
});
