import React, { useEffect, useState } from 'react';
import SearchModal from './SearchModal';
import { Icon } from '@components/Icon';

import styles from '@design-system/modules/Search.module.scss';

/**
 * grid-packages/ag-grid-docs/documentation
 * The website uses Algolia to power its search functionality. This component builds on components provided by Algolia
 * to render the search box and results.
 */
const Search = ({ currentFramework }) => {
    const [isOpen, setOpen] = useState(false);

    const isMacLike =
        /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ||
        /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgentData.platform);

    /**
     * When search is mounted, add global listeners to open/close the search
     */
    useEffect(() => { 
        const onKeyDownAnywhere = (e) => {
            const isMetaK = e.key === 'k' && (e.metaKey || e.ctrlKey);
            const isEsc = e.key === 'Escape';
            
            if (isMetaK || isEsc) {
                // use the callback so we don't need to update the func ref,
                // and start removing/adding the callback, which would be messy
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', onKeyDownAnywhere);

        return () => document.removeEventListener('keydown', onKeyDownAnywhere);
    }, []);

    return <>
        <div className={styles.headerSearchBox} onClick={() => setOpen(true)}>
            <Icon name="search" svgClasses={styles.searchIcon}/>
            <span className={styles.placeholder}>Search...</span>
            <span className={styles.kbdShortcut}>{ isMacLike ? `⌘ K` : `Ctrl K` }</span>
        </div>
        
        { isOpen && <SearchModal currentFramework={currentFramework} closeModal={() => setOpen(false)} /> }
    </>;
}

export default Search;
