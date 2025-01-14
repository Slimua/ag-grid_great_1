import { useStore } from '@nanostores/react';
import { $queryClient } from '@stores/queryClientStore';
import { QueryClientProvider } from '@tanstack/react-query';

import { InterfaceDocumentation, type InterfaceDocumentationProps } from './ReferenceDocumentation';
import { useResolvedDocInterfaces, useResolvedInterfaces } from './useResolvedInterfaces';

type Props = Omit<InterfaceDocumentationProps, 'interfaceLookup' | 'codeLookup'>;

export function InterfaceDocumentationWithQuery(props: Props) {
    const queryClient = useStore($queryClient);

    return (
        <QueryClientProvider client={queryClient}>
            <InterfaceDocumentationWithLookups {...props} />
        </QueryClientProvider>
    );
}

function InterfaceDocumentationWithLookups(props: Props) {
    const interfaceLookup = useResolvedInterfaces();
    const codeLookup = useResolvedDocInterfaces();

    return (
        interfaceLookup &&
        codeLookup && <InterfaceDocumentation {...props} interfaceLookup={interfaceLookup} codeLookup={codeLookup} />
    );
}
