import { clusterNavigatorItemKind } from "@k8slens/cluster-contracts";
import { DropDownMenuItemRow } from "@k8slens/drop-down-menu-items";
import { AddIcon, DeleteIcon, EditIcon, LayersIcon, LinkIcon, OpenInBrowserIcon, PlayArrowIcon, RemoveCircleOutlineIcon } from "@k8slens/icon";
import {
  getNavigatorItemMenuItemInjectableBunch,
  type NavigatorItemOfKind,
  navigatorItemDropDownMenuOrderNumbers,
} from "@k8slens/navigator-contracts";
import { useInject } from "@k8slens/use-inject";
import { allClustersGroupId } from "../cluster-groups.injectable";
import { connectClustersInjectable } from "../connect-clusters.injectable";
import { groupFlowsInjectable } from "../group-flows.injectable";
import { clusterGroupKind, clusterGroupMemberKind, clusterGroupsRootKind } from "./kinds";

const { item: itemSection, removal: removalSection, sectionEnd } = navigatorItemDropDownMenuOrderNumbers;

// The branch at the top.

const NewGroup = () => {
  const flows = useInject(groupFlowsInjectable)();

  return (
    <DropDownMenuItemRow Icon={AddIcon} $onClick={() => flows.createGroup()}>
      New group…
    </DropDownMenuItemRow>
  );
};

export const newGroupMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-new-group",
  forItemsOfKind: clusterGroupsRootKind,
  orderNumber: itemSection,
  Component: NewGroup,
});

const ConnectAll = () => {
  const flows = useInject(groupFlowsInjectable)();

  return (
    <DropDownMenuItemRow Icon={PlayArrowIcon} $onClick={() => flows.connectAll()}>
      Connect all clusters
    </DropDownMenuItemRow>
  );
};

export const connectAllMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-connect-all",
  forItemsOfKind: clusterGroupsRootKind,
  orderNumber: itemSection + 1,
  Component: ConnectAll,
});

// A group.

const groupIdOf = (ids: readonly string[]) => ids[1];
const isOwnGroup = (item: { readonly ids: readonly string[] }) => groupIdOf(item.ids) !== allClustersGroupId;

const ConnectGroup = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupKind> }) => {
  const flows = useInject(groupFlowsInjectable)();

  return (
    <DropDownMenuItemRow Icon={PlayArrowIcon} $onClick={() => flows.connectGroup(groupIdOf(data.ids))}>
      Connect all in group
    </DropDownMenuItemRow>
  );
};

export const connectGroupMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-connect-group",
  forItemsOfKind: clusterGroupKind,
  orderNumber: itemSection,
  Component: ConnectGroup,
});

const EditGroup = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupKind> }) => {
  const flows = useInject(groupFlowsInjectable)();

  return (
    <DropDownMenuItemRow Icon={EditIcon} $onClick={() => flows.editGroup(groupIdOf(data.ids))}>
      Edit group…
    </DropDownMenuItemRow>
  );
};

export const editGroupMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-edit-group",
  forItemsOfKind: clusterGroupKind,
  orderNumber: itemSection + 1,
  isVisible: isOwnGroup,
  Component: EditGroup,
});

const NewGroupFromAll = () => {
  const flows = useInject(groupFlowsInjectable)();

  return (
    <DropDownMenuItemRow Icon={AddIcon} $onClick={() => flows.createGroup()}>
      New group…
    </DropDownMenuItemRow>
  );
};

export const newGroupFromAllMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-new-group-from-all",
  forItemsOfKind: clusterGroupKind,
  orderNumber: itemSection + 1,
  isVisible: (item) => !isOwnGroup(item),
  Component: NewGroupFromAll,
});

const DeleteGroup = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupKind> }) => {
  const flows = useInject(groupFlowsInjectable)();

  return (
    <DropDownMenuItemRow Icon={DeleteIcon} $onClick={() => flows.deleteGroup(groupIdOf(data.ids))}>
      Delete group…
    </DropDownMenuItemRow>
  );
};

export const deleteGroupMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-delete-group",
  forItemsOfKind: clusterGroupKind,
  orderNumber: removalSection,
  isVisible: isOwnGroup,
  Component: DeleteGroup,
});

// A cluster inside a group.

const OpenMember = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupMemberKind> }) => {
  const flows = useInject(groupFlowsInjectable)();
  const [, , clusterId] = data.ids;

  return (
    <DropDownMenuItemRow Icon={OpenInBrowserIcon} $onClick={() => flows.openCluster(clusterId)}>
      Open pods
    </DropDownMenuItemRow>
  );
};

export const openMemberMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-open-member",
  forItemsOfKind: clusterGroupMemberKind,
  orderNumber: itemSection - 1,
  Component: OpenMember,
});

const ConnectMember = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupMemberKind> }) => {
  const connectClusters = useInject(connectClustersInjectable)();
  const [, , clusterId] = data.ids;

  return (
    <DropDownMenuItemRow Icon={LinkIcon} $onClick={() => connectClusters.connect([clusterId], data.name)}>
      Connect
    </DropDownMenuItemRow>
  );
};

export const connectMemberMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-connect-member",
  forItemsOfKind: clusterGroupMemberKind,
  orderNumber: itemSection,
  Component: ConnectMember,
});

const EditGroupsOfMember = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupMemberKind> }) => {
  const flows = useInject(groupFlowsInjectable)();
  const [, , clusterId] = data.ids;

  return (
    <DropDownMenuItemRow Icon={LayersIcon} $onClick={() => flows.pickGroupsOfCluster(clusterId)}>
      Cluster groups…
    </DropDownMenuItemRow>
  );
};

export const editGroupsOfMemberMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-edit-groups-of-member",
  forItemsOfKind: clusterGroupMemberKind,
  orderNumber: itemSection + 1,
  Component: EditGroupsOfMember,
});

const RemoveMember = ({ data }: { data: NavigatorItemOfKind<typeof clusterGroupMemberKind> }) => {
  const flows = useInject(groupFlowsInjectable)();
  const [, groupId, clusterId] = data.ids;

  return (
    <DropDownMenuItemRow Icon={RemoveCircleOutlineIcon} $onClick={() => flows.removeClusterFromGroup(groupId, clusterId)}>
      Remove from group
    </DropDownMenuItemRow>
  );
};

export const removeMemberMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-remove-member",
  forItemsOfKind: clusterGroupMemberKind,
  orderNumber: removalSection,
  isVisible: isOwnGroup,
  Component: RemoveMember,
});

// Lens's own cluster items, wherever they sit in the navigator.

const AddClusterToGroups = ({ data }: { data: NavigatorItemOfKind<typeof clusterNavigatorItemKind> }) => {
  const flows = useInject(groupFlowsInjectable)();
  const clusterId = data.ids[data.ids.length - 1];

  return (
    <DropDownMenuItemRow Icon={LayersIcon} $onClick={() => flows.pickGroupsOfCluster(clusterId)}>
      Add to cluster groups…
    </DropDownMenuItemRow>
  );
};

export const addClusterToGroupsMenuItem = getNavigatorItemMenuItemInjectableBunch({
  id: "cluster-groups-add-cluster-to-groups",
  forItemsOfKind: clusterNavigatorItemKind,
  orderNumber: sectionEnd + 100,
  Component: AddClusterToGroups,
});
