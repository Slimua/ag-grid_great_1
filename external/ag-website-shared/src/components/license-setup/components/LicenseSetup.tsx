import type { Framework, ImportType, MenuItem } from '@ag-grid-types';
import Note from '@ag-website-shared/components/alert/Note';
import Warning from '@ag-website-shared/components/alert/Warning';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { FrameworkSelectorInsideDocs } from '@components/framework-selector-inside-doc/FrameworkSelectorInsideDocs';
import { Snippet } from '@components/snippet/Snippet';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { type FunctionComponent, useMemo } from 'react';

import { getBootstrapSnippet, getDependenciesSnippet, getNpmInstallSnippet } from '../utils/getSnippets';
import { hasValue } from '../utils/hasValue';
import { useLicenseData } from '../utils/useLicenseData';
import styles from './LicenseSetup.module.scss';

interface SeedRepo {
    name: string;
    framework: Framework;
    importType: ImportType;
    licenseType: 'enterprise' | 'enterprise-bundle';
    devEnvironment: string;
    url: string;
}

interface Props {
    framework: Framework;
    path: string;
    menuItems: MenuItem[];
    seedRepos: SeedRepo[];
}

const DUMMY_LICENSE_KEY =
    'Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-963284}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{AcmeCorp}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{AcmeApp}_only_for_{1}_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_{AcmeApp}_need_to_be_licensed___{AcmeApp}_has_been_granted_a_Deployment_License_Add-on_for_{1}_Production_Environment___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{04_May_2024}____[v3]_[0102]_4F37JqkNmUUpwds1nG==WwlRFepEGJshElLJE3uKnQ6vcbwTaJF6';

const EmailSales = () => {
    return (
        <>
            Please contact <a href="mailto:info@ag-grid.com">info@ag-grid.com</a> for assistance
        </>
    );
};

export const LicenseSetup: FunctionComponent<Props> = ({ framework, path, menuItems, seedRepos }) => {
    const {
        userLicense,
        setUserLicense,
        importType,
        updateImportTypeWithUrlUpdate,
        licensedProducts,
        isIntegratedCharts,
        updateIsIntegratedChartsWithUrlUpdate,
        userLicenseExpiry,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
        errors,
    } = useLicenseData();
    const dependenciesSnippet = useMemo(
        () =>
            getDependenciesSnippet({
                framework,
                isIntegratedCharts,
                importType,
            }),
        [framework, isIntegratedCharts, importType]
    );
    const npmInstallSnippet = useMemo(
        () =>
            getNpmInstallSnippet({
                framework,
                isIntegratedCharts,
                importType,
            }),
        [framework, isIntegratedCharts, importType]
    );
    const bootstrapSnippet = useMemo(
        () =>
            getBootstrapSnippet({
                framework,
                importType,
                license: userLicense || 'your License Key',
                isIntegratedCharts,
            }),
        [framework, importType, userLicense, isIntegratedCharts]
    );
    const selectedSeedRepos = useMemo(
        () =>
            seedRepos
                .filter(({ licenseType }) => {
                    return isIntegratedCharts ? licenseType === 'enterprise-bundle' : licenseType === 'enterprise';
                })
                .filter((seedRepo) => {
                    return seedRepo.framework === framework && seedRepo.importType === importType;
                }),
        [seedRepos, isIntegratedCharts, framework, importType]
    );

    return (
        <>
            <form>
                <h2>Validate your licence</h2>

                <div className={styles.licenceWrapper}>
                    <textarea
                        className={classnames(styles.license, {
                            [styles.error]: errors.userLicenseError,
                        })}
                        placeholder="Paste your License Key here."
                        value={userLicense}
                        onChange={(e) => {
                            setUserLicense(e.target.value);
                        }}
                    ></textarea>

                    {userLicense === '' && (
                        <span className={styles.licencePlaceholder}>
                            <b>Paste your License Key here, e.g., </b>
                            <span>{DUMMY_LICENSE_KEY}</span>
                        </span>
                    )}
                </div>

                {hasValue(userLicense) && (
                    <div className={styles.licenseOutput}>
                        <span className={licensedProducts.grid ? styles.valid : styles.invalid}>
                            <Icon name={licensedProducts.grid ? 'tick' : 'cross'} /> AG Grid Enterprise
                        </span>
                        <span className={licensedProducts.charts ? styles.valid : styles.invalid}>
                            <Icon name={licensedProducts.charts ? 'tick' : 'cross'} />
                            AG Charts Enterprise
                        </span>
                    </div>
                )}

                {errors.expired && (
                    <Warning>
                        {errors.expired}. <EmailSales />
                    </Warning>
                )}

                {errors.expiredTrial && (
                    <Warning>
                        {errors.expiredTrial}. <EmailSales />
                    </Warning>
                )}

                {errors.userLicenseError && (
                    <Warning>
                        {errors.userLicenseError}. <EmailSales />
                    </Warning>
                )}

                {errors.v2License && (
                    <Warning>
                        {errors.v2License}. <EmailSales />
                    </Warning>
                )}

                {errors.chartsNoGridEnterprise && (
                    <Warning>
                        {errors.chartsNoGridEnterprise}. <EmailSales />
                    </Warning>
                )}

                {/* TODO change "AG Grid" to grid/charts based on site */}

                {!hasValue(userLicense) && (
                    <Note>
                        Visit the <a href={urlWithBaseUrl('/license-pricing')}>Pricing Page</a> to discover the power of
                        AG Grid Enterprise and <b>buy</b> a licence key.
                        <br />
                        Alternatively, email <a href="mailto:info@ag-grid.com">info@ag-grid.com</a> to start a
                        conversation or <b>request a trial licence key</b>.
                    </Note>
                )}

                <div className={styles.licenseData}>
                    <div>
                        <label>Licence key expires: </label>
                        <b className={(errors.expired || errors.expiredTrial) && styles.expired}>
                            {userLicenseExpiry ? userLicenseExpiry : '--'}
                        </b>
                    </div>

                    <div>
                        <h2>Configure your application</h2>

                        <div className={styles.icQuestion}>
                            <label
                                className={classnames(styles.licensedProduct, styles.integratedProduct, {
                                    [styles.valid]: licensedProducts.grid && licensedProducts.charts,
                                    [styles.trial]:
                                        userLicenseIsTrial && licensedProducts.grid && licensedProducts.charts,
                                    [styles.expired]:
                                        (userLicenseIsExpired || userLicenseTrialIsExpired) &&
                                        licensedProducts.grid &&
                                        licensedProducts.charts,
                                })}
                            >
                                Are you using Integrated Charts?{' '}
                                <input
                                    type="checkbox"
                                    name="products"
                                    value="integratedEnterprise"
                                    checked={isIntegratedCharts}
                                    onChange={() => {
                                        updateIsIntegratedChartsWithUrlUpdate(!isIntegratedCharts);
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    {errors.gridNoCharts && (
                        <Warning>
                            {errors.gridNoCharts}. <EmailSales />
                        </Warning>
                    )}

                    <div className={styles.frameworkImportContainer}>
                        <div className={styles.frameworkContainer}>
                            <label>Framework</label>
                            <FrameworkSelectorInsideDocs
                                path={path}
                                currentFramework={framework}
                                menuItems={menuItems}
                            />
                        </div>

                        <span className={styles.divider}></span>

                        <div className={styles.importContainer}>
                            <label>
                                <span>Import type:</span>
                            </label>

                            <select
                                name="importType"
                                value={importType}
                                onChange={(e) => {
                                    updateImportTypeWithUrlUpdate(e.target.value as ImportType);
                                }}
                            >
                                <option value="packages">Packages</option>
                                <option value="modules">Modules</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.results}>
                    <h3 id="add-your-dependencies">Add Your Dependencies</h3>

                    <p>
                        Copy the following dependencies into your <code>package.json</code>:
                    </p>

                    {dependenciesSnippet && (
                        <Snippet framework={framework} content={dependenciesSnippet} copyToClipboard />
                    )}

                    <p>Or install using npm:</p>

                    {npmInstallSnippet && (
                        <Snippet framework={framework} content={npmInstallSnippet} language="bash" copyToClipboard />
                    )}

                    <h3 id="set-up-your-application">Set Up Your Application</h3>

                    <p>An example of how to set up your AG Grid Enterprise License Key:</p>
                    {bootstrapSnippet.grid && (
                        <Snippet framework={framework} content={bootstrapSnippet.grid} copyToClipboard />
                    )}

                    <h2 id="seed-repos">Seed Repositories</h2>

                    {selectedSeedRepos.length ? (
                        <>
                            <p>Here are some seed code repositories to get you started:</p>

                            <table className={styles.reposTable} role="grid">
                                <thead>
                                    <tr>
                                        <th scope="col">Github Repo</th>
                                        <th scope="col">Framework</th>
                                        <th scope="col">Development Environment</th>
                                        <th scope="col">Import Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSeedRepos.map(({ name, url, framework, devEnvironment, importType }) => {
                                        return (
                                            <tr key={url}>
                                                <td>
                                                    <a
                                                        className={classnames(styles.repoButton, 'button-secondary')}
                                                        href={url}
                                                    >
                                                        <Icon name="github" />
                                                        {name}
                                                    </a>
                                                </td>
                                                <td>
                                                    <img
                                                        className={styles.frameworkLogo}
                                                        src={urlWithBaseUrl(`/images/fw-logos/${framework}.svg`)}
                                                        alt={framework}
                                                    />{' '}
                                                    {framework}
                                                </td>
                                                <td>{devEnvironment}</td>
                                                <td>{importType}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <p>Select your enterprise products above to view seed repositories.</p>
                    )}
                </div>
            </form>
        </>
    );
};
