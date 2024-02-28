import classnames from 'classnames';
import React from 'react';
import styles from '@design-system/modules/FrameworkSelector.module.scss';

const fwLogos = 'images/fw-logos/';

export default function FrameworkSelector({ data, currentFramework, isFullWidth, showSelectedFramework }) {
    return (
        <div
            className={classnames(styles.frameworkSelector, {
                [styles.fullWidth]: isFullWidth,
                [styles.showSelected]: showSelectedFramework,
            })}
        >
            {data.map((framework) => {
                const isSelected = showSelectedFramework && framework.name === currentFramework;
                const frameworkCapitalised = framework.name.charAt(0).toUpperCase() + framework.name.slice(1);
                const alt = `${frameworkCapitalised} Data Grid`;

                return (
                    <a
                        href={`${framework.url}getting-started`}
                        key={framework.name}
                        className={classnames(styles.option, {
                            [styles.selected]: isSelected,
                        })}
                    >
                        <img src={`./${fwLogos}${framework.name}.svg`} alt={alt} />
                        <span>{frameworkCapitalised}</span>
                    </a>
                );
            })}
        </div>
    );
}
