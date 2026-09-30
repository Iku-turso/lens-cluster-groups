import { P } from "@k8slens/element-components";
import { DangerButton, PlainButton } from "@k8slens/input-components";
import { WarningIcon } from "@k8slens/icon";
import { ModalContainer, ModalContent, ModalFooter, ModalHeader } from "@k8slens/modal-components";
import { getModalInjectableBunch, getModalKind, type ModalProps, useRespondFromModal } from "@k8slens/modal-contracts";

export const confirmDeleteGroupModalKind = getModalKind<[groupName: string], boolean>()("confirm-delete-group");

const ConfirmDeleteGroupModal = ({ input: [groupName] }: ModalProps<typeof confirmDeleteGroupModalKind>) => {
  const respond = useRespondFromModal(confirmDeleteGroupModalKind);

  return (
    <ModalContainer>
      <ModalHeader icon={<WarningIcon />}>Delete group</ModalHeader>

      <ModalContent>
        <P>
          Delete the group “{groupName}”? Its clusters stay in Lens, only the group goes away.
        </P>
      </ModalContent>

      <ModalFooter>
        <PlainButton onClick={() => respond(false)}>Cancel</PlainButton>
        <DangerButton onClick={() => respond(true)}>Delete</DangerButton>
      </ModalFooter>
    </ModalContainer>
  );
};

export default getModalInjectableBunch({
  kind: confirmDeleteGroupModalKind,
  Component: ConfirmDeleteGroupModal,
  onClose: () => false,
});
