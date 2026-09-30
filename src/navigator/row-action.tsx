import { Button, type ButtonProps, Div, type DivProps } from "@k8slens/element-components";
import { NavigatorItemActions } from "@k8slens/navigator-components";
import type { MouseEvent, ReactNode } from "react";

const keepClickInActions = (event: MouseEvent) => event.stopPropagation();

/** The actions at the end of a row. Clicking one does not also open or select the row. */
export const RowActions = ({ children, ...rest }: DivProps & { readonly children: ReactNode }) => (
  <NavigatorItemActions onClick={keepClickInActions} onDoubleClick={keepClickInActions} {...rest}>
    {children}
  </NavigatorItemActions>
);

/** An icon-only button among a row's actions, looking like the navigator's own drill-down button. */
export const RowActionButton = ({ children, ...rest }: ButtonProps) => (
  <Button $interactive $flex={{ verticalAlign: "center" }} {...rest}>
    {children}
  </Button>
);

/** A status glyph among a row's actions, the size of a button so the row does not shift. */
export const RowActionStatus = ({ children, ...rest }: DivProps) => (
  <Div $flex={{ verticalAlign: "center" }} {...rest}>
    {children}
  </Div>
);
