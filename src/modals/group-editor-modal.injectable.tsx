import { Div, Form, Span } from "@k8slens/element-components";
import { MultiSelect, PlainButton, PrimaryButton, type SelectOption, TextInput } from "@k8slens/input-components";
import { LayersIcon } from "@k8slens/icon";
import { ModalContainer, ModalContent, ModalFooter, ModalHeader } from "@k8slens/modal-components";
import { getModalInjectableBunch, getModalKind, type ModalProps, useRespondFromModal } from "@k8slens/modal-contracts";
import { useInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { useState } from "react";
import type { ClusterGroupDraft } from "../cluster-groups.injectable";
import { byClusterName, clusterRecordsInjectable } from "../cluster-records.injectable";

export const groupEditorModalKind = getModalKind<
  [title: string, confirmLabel: string, initial: ClusterGroupDraft],
  ClusterGroupDraft | undefined
>()("group-editor");

const GroupEditorModal = observer(({ input: [title, confirmLabel, initial] }: ModalProps<typeof groupEditorModalKind>) => {
  const respond = useRespondFromModal(groupEditorModalKind);
  const clusterRecords = useInject(clusterRecordsInjectable)();
  const [name, setName] = useState(initial.name);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<readonly string[]>(initial.clusterIds);

  const clusters = clusterRecords.all.get().slice().sort(byClusterName);
  const shown = clusters.filter((cluster) => cluster.name.get().toLowerCase().includes(filter.trim().toLowerCase()));
  const options: SelectOption<string>[] = shown.map((cluster) => ({ id: cluster.id, label: cluster.name.get() }));
  const known = new Set(clusters.map((cluster) => cluster.id));
  const selectedCount = selected.filter((id) => known.has(id)).length;
  const canSave = name.trim() !== "";

  const toggle = (clusterId: string) =>
    setSelected(selected.includes(clusterId) ? selected.filter((id) => id !== clusterId) : [...selected, clusterId]);

  const save = () => canSave && respond({ name: name.trim(), clusterIds: selected.filter((id) => known.has(id)) });

  return (
    <ModalContainer $style={{ width: "calc(var(--unit, 8px) * 60)", maxWidth: "90vw" }}>
      <ModalHeader icon={<LayersIcon />}>{title}</ModalHeader>

      <ModalContent>
        <Form
          $flex={{ direction: "vertical", gap: "m" }}
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <TextInput autoFocus placeholder="Group name, e.g. Production" value={name} onChange={(event) => setName(event.target.value)} />

          <Div $flex={{ direction: "horizontal", gap: "s", verticalAlign: "center" }}>
            <TextInput type="search" placeholder="Filter clusters" value={filter} onChange={(event) => setFilter(event.target.value)} />
            <PlainButton onClick={() => setSelected([...new Set([...selected, ...shown.map((cluster) => cluster.id)])])}>All</PlainButton>
            <PlainButton onClick={() => setSelected(selected.filter((id) => !shown.some((cluster) => cluster.id === id)))}>None</PlainButton>
          </Div>

          <Div $style={{ maxHeight: "50vh", overflowY: "auto" }}>
            {clusters.length === 0 ? (
              <Span $padding="s">Lens knows no clusters yet.</Span>
            ) : options.length === 0 ? (
              <Span $padding="s">No cluster matches “{filter}”.</Span>
            ) : (
              <MultiSelect options={options} selected={selected} onToggle={toggle} />
            )}
          </Div>

          <Span>
            {selectedCount} of {clusters.length} clusters selected
          </Span>
        </Form>
      </ModalContent>

      <ModalFooter>
        <PlainButton onClick={() => respond(undefined)}>Cancel</PlainButton>
        <PrimaryButton $disabled={!canSave} onClick={save}>
          {confirmLabel}
        </PrimaryButton>
      </ModalFooter>
    </ModalContainer>
  );
});

export default getModalInjectableBunch({
  kind: groupEditorModalKind,
  Component: GroupEditorModal,
  onClose: () => undefined,
});
