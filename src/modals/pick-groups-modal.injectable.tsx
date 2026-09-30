import { Div, P } from "@k8slens/element-components";
import { MultiSelect, PlainButton, PrimaryButton, type SelectOption, TextInput } from "@k8slens/input-components";
import { LayersIcon } from "@k8slens/icon";
import { ModalContainer, ModalContent, ModalFooter, ModalHeader } from "@k8slens/modal-components";
import { getModalInjectableBunch, getModalKind, type ModalProps, useRespondFromModal } from "@k8slens/modal-contracts";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { useState } from "react";
import { clusterGroupsInjectable } from "../cluster-groups.injectable";

export interface PickedGroups {
  readonly groupIds: readonly string[];
  /** The name of a group to create with the cluster in it, when the user typed one. */
  readonly newGroupName?: string;
}

export const pickGroupsModalKind = getModalKind<[clusterName: string, groupIds: readonly string[]], PickedGroups | undefined>()(
  "pick-groups",
);

const PickGroupsModal = observer(({ input: [clusterName, initialGroupIds] }: ModalProps<typeof pickGroupsModalKind>) => {
  const respond = useRespondFromModal(pickGroupsModalKind);
  const clusterGroups = useInject(clusterGroupsInjectable)();
  const [selected, setSelected] = useState<readonly string[]>(initialGroupIds);
  const [newGroupName, setNewGroupName] = useState("");

  const options: SelectOption<string>[] = clusterGroups.all.get().map((group) => ({ id: group.id, label: group.name }));

  const toggle = (groupId: string) =>
    setSelected(selected.includes(groupId) ? selected.filter((id) => id !== groupId) : [...selected, groupId]);

  return (
    <ModalContainer $style={{ width: "calc(var(--unit, 8px) * 50)", maxWidth: "90vw" }}>
      <ModalHeader icon={<LayersIcon />}>Groups of {clusterName}</ModalHeader>

      <ModalContent>
        <Div $flex={{ direction: "vertical", gap: "m" }}>
          {options.length === 0 ? (
            <P>You have no groups yet. Name one below to create it with {clusterName} in it.</P>
          ) : (
            <Div $style={{ maxHeight: "40vh", overflowY: "auto" }}>
              <MultiSelect options={options} selected={selected} onToggle={toggle} />
            </Div>
          )}

          <TextInput placeholder="…or a new group" value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} />
        </Div>
      </ModalContent>

      <ModalFooter>
        <PlainButton onClick={() => respond(undefined)}>Cancel</PlainButton>
        <PrimaryButton onClick={() => respond({ groupIds: selected, newGroupName: newGroupName.trim() || undefined })}>
          Save
        </PrimaryButton>
      </ModalFooter>
    </ModalContainer>
  );
});

export default getModalInjectableBunch({
  kind: pickGroupsModalKind,
  Component: PickGroupsModal,
  onClose: () => undefined,
});
