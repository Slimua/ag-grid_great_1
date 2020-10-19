import { RowNode } from "../entities/rowNode";
import { Autowired, Bean, PostConstruct } from "../context/context";
import { GridOptionsWrapper } from "../gridOptionsWrapper";
import { IsRowSelectable } from "../entities/gridOptions";
import { BeanStub } from "../context/beanStub";
import { find, exists } from "../utils/generic";

@Bean('selectableService')
export class SelectableService extends BeanStub {

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;

    private groupSelectsChildren: boolean;
    private isRowSelectableFunc?: IsRowSelectable;

    @PostConstruct
    public init(): void {
        this.groupSelectsChildren = this.gridOptionsWrapper.isGroupSelectsChildren();
        this.isRowSelectableFunc = this.gridOptionsWrapper.getIsRowSelectableFunc();
    }

    public updateSelectableAfterGrouping(rowNode: RowNode): void {
        if (this.isRowSelectableFunc) {
            const nextChildrenFunc = (node: RowNode) => node.childrenAfterGroup;
            this.recurseDown(rowNode.childrenAfterGroup, nextChildrenFunc);
        }
    }

    public updateSelectableAfterFiltering(rowNode: RowNode): void {
        if (this.isRowSelectableFunc) {
            const nextChildrenFunc = (node: RowNode) => node.childrenAfterFilter;
            this.recurseDown(rowNode.childrenAfterGroup, nextChildrenFunc);
        }
    }

    private recurseDown(children: RowNode[] | null, nextChildrenFunc: ((rowNode: RowNode) => RowNode[] | null)): void {
        if (!children) { return; }

        children.forEach((child: RowNode) => {

            if (!child.group) { return; } // only interested in groups

            if (child.hasChildren()) {
                this.recurseDown(nextChildrenFunc(child), nextChildrenFunc);
            }

            let rowSelectable: boolean;

            if (this.groupSelectsChildren) {
                // have this group selectable if at least one direct child is selectable
                const firstSelectable = find(nextChildrenFunc(child), 'selectable', true);
                rowSelectable = exists(firstSelectable);
            } else {
                // directly retrieve selectable value from user callback
                rowSelectable = this.isRowSelectableFunc ? this.isRowSelectableFunc(child) : false;
            }

            child.setRowSelectable(rowSelectable);
        });
    }

}
