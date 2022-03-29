import React from 'react';
import logos from 'images/logos';
import MenuView from 'components/menu-view/MenuView';
import {SEO} from 'components/SEO';
import {convertUrl} from 'components/documentation-helpers';
import menuData from '../../doc-pages/licensing/menu.json';
import styles from './home.module.scss';
import videoStyles from '../components/VideoSection.module.scss';
import ReactPlayer from 'react-player'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPlayCircle} from '@fortawesome/free-solid-svg-icons'
import {phpPrefix} from "../utils/consts";

const flatRenderItems = (items, framework) => {
    return items.reduce((prev, curr) => {
        let ret = prev;

        if (curr.frameworks && curr.frameworks.indexOf(framework) === -1) {
            return ret;
        }

        ret = prev.concat(Object.assign({}, {title: curr.title, url: curr.url}, curr.icon ? {icon: curr.icon} : {}));

        if (!curr.items) {
            return ret;
        }

        return ret.concat(flatRenderItems(curr.items, framework));
    }, []);
};

const panelItemsFilter = (pane, framework) => data => ((data.frameworks && data.frameworks.indexOf(framework) !== -1) || !data.frameworks) && data.pane === pane;

const urlMap = {
    javascript: {
        'video-tutorial': 'https://youtu.be/KS-wg5zfCXc',
        'example': 'https://plnkr.co/edit/nmWxAxWONarW5gj2?p=preview?p=preview'
    },
    angular: {
        'video-tutorial': 'https://youtu.be/AeEfiWAGyLc',
        'example': 'https://stackblitz.com/edit/ag-grid-angular-hello-world',
        'thinkster': 'https://thinkster.io/tutorials/fundamentals-of-ag-grid-with-angular'
    },
    react: {
        'video-tutorial': 'https://youtu.be/GTu79aWJT1E',
        'example': 'https://stackblitz.com/edit/ag-grid-react-hello-world',
        'thinkster': 'https://thinkster.io/tutorials/using-ag-grid-with-react-getting-started'
    },
    vue: {
        'video-tutorial': 'https://youtu.be/eW3qCti1lsA',
        'example': 'https://stackblitz.com/edit/ag-grid-vue-hello-world'
    }
};

const parseGettingStartedUrl = (url, framework) => {
    const match = url.match(/{(\w+-?\w*)}/);

    if (match) {
        return {
            href: urlMap[framework][match[1]],
            target: '_blank',
            rel: 'noreferrer'
        };
    }

    return {
        href: convertUrl(url, framework)
    };
};

const getLogo = (name, framework) => logos[name === 'framework' ? framework : name];

const GettingStartedPane = ({framework, data}) => {
    const linksToRender = flatRenderItems(data, framework);

    return (
        <div className={styles['docs-home__getting-started__item_pane']}>
            {linksToRender.map(link => {
                const parsedLink = parseGettingStartedUrl(link.url, framework);
                const frameworkCapitalised = framework.charAt(0).toUpperCase() + framework.slice(1);
                const alt = `${frameworkCapitalised} Grid: ${link.title}`;

                return (
                    <a key={`${framework}_${link.title.replace(/\s/g, '').toLowerCase()}`} {...parsedLink}
                       className={styles['docs-home__getting-started__item']}>
                        <div className={styles['docs-home__getting-started__item_logo']}>
                            <img src={getLogo(link.icon, framework)} alt={alt} style={{height: 64, width: 64}}/>
                        </div>
                        <div className={styles['docs-home__getting-started__item_label']}>
                            {link.title}
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

const GettingStarted = ({framework, data}) => {
    const title = `${framework === 'javascript' ? 'JavaScript' : framework} Data Grid: Getting Started`;
    const leftPaneItems = data.filter(panelItemsFilter('left', framework));
    const rightPaneItems = data.filter(panelItemsFilter('right', framework));

    return (
        <div className={styles['docs-home__getting-started']}>
            <h2 className={styles['docs-home__getting-started__title']}>{title}</h2>
            <div className={styles['docs-home__getting-started__row']}>
                <GettingStartedPane framework={framework} data={leftPaneItems}/>
                {rightPaneItems.length > 0 && <GettingStartedPane framework={framework} data={rightPaneItems}/>}
            </div>
        </div>
    );
};

const VideoPanel = ({framework}) => {
    const PlayerPanel = props => (
        <div style={{marginLeft: "1rem", width: 320}}>
            <ReactPlayer url={`https://www.youtube.com/watch?v=${props.id}`}
                         height={180}
                         width={320}
                         light={`https://i.ytimg.com/vi/${props.id}/mqdefault.jpg`}
                         title={props.title}>

            </ReactPlayer>
            <span style={{fontSize: "smaller"}}>{props.title}</span>
        </div>
    );
    return (
        <div className={styles['docs-home__getting-started']} style={{marginTop: "-2rem"}}>
            <h2 className={styles['docs-home__getting-started__title']}>
                {framework === 'javascript' ? 'JavaScript' : framework} Data Grid: Featured Videos
            </h2>
            <h4 className={styles['docs-home__getting-started__title']} style={{marginTop: "-0.5rem"}}>
                Some text Some text Some text Some text Some text Some text Some text Some text
            </h4>
            <div style={{
                display: "flex",
                flexGrow: 1,
                flexWrap: "wrap",
                justifyContent: "space-between",
                marginLeft: "1rem",
                paddingTop: "1rem",
                paddingBottom: "1rem",
                paddingRight: "1rem",
                border: "1px solid #d0d4d6",
                borderRadius: "5px"
            }}>
                <PlayerPanel id="PyGnASnJgGo" title="Quickstart Tutorial for the React Data Grid from AG Grid"/>
                <PlayerPanel id="9IbhW4z--mg" title="Customising Cells with React Components as Cell Renderers"/>
                <PlayerPanel id="pebXUHUdlos" title="Built-in column filters overview for the React Data Grid from AG Grid"/>
                <div>
                    <div className={videoStyles['video-section']}
                         style={{marginLeft: "1rem", border: "1px solid #d0d4d6", borderRadius: "5px", height: 180, width: 320}}>
                        <a href={`${phpPrefix}/videos.php`} style={{margin: "auto"}}>
                            <div style={{flexDirection: "column"}}>
                                <FontAwesomeIcon icon={faPlayCircle} size="6x"/>
                                <div style={{width: "80%", margin: "0 auto"}}>All Videos</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
};

/**
 * This is the home page for the documentation.
 */
const HomePage = ({pageContext: {framework}}) => {
    // basics / getting started
    const gettingStartedItems = menuData[0].items[0].items;

    return (
        <div className={styles['docs-home']}>
            {/*eslint-disable-next-line react/jsx-pascal-case*/}
            <SEO
                title="Documentation"
                description="Our documentation will help you to get up and running with AG Grid."
                framework={framework}
                pageName="home"
            />
            <GettingStarted framework={framework} data={gettingStartedItems}/>
            {framework === 'react' && <VideoPanel framework={framework}></VideoPanel>}
            <MenuView framework={framework} data={menuData}/>
        </div>
    );
};

export default HomePage;
