import { ChevronRight } from '@carbon/icons-react';
import styled from '@emotion/styled';
import { UIDropdownButton } from '../../components/UIDropdownButton';
import { ColorSwatch } from './ColorSwatch';
import { TabbedColorEditor } from './TabbedColorEditor';
import { ControlledColorEditorProps } from './color-editor-utils';

export const ColorEditor = (props: ControlledColorEditorProps) => {
  return (
    <SwatchButton
      dropdownContent={<TabbedColorEditor {...props} initialValue={props.value} />}
      endDecorator={<DropdownIcon />}
    >
      <SmallColorSwatch color={props.value} />
    </SwatchButton>
  );
};

const SmallColorSwatch = styled(ColorSwatch)`
  width: 48px;
  height: 32px;
  border-radius: 0;
  border: none;
`;

const SwatchButton = styled(UIDropdownButton)`
  padding: 0;
  height: 32px;
  min-height: 32px;
  overflow: hidden;
  display: flex;
  width: 80px;
  gap: 0;
  justify-content: space-between;
`;

const DropdownIcon = styled(ChevronRight)`
  margin-right: 8px;
  zoom: 80%;
`;
