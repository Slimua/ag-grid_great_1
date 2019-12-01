<?php
$navKey = "licenseAndPricing";
include_once 'includes/html-helpers.php';
gtm_data_layer('community-enterprise');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
    meta_and_links("ag-Grid: License and Pricing", "ag-Grid Javascript Grid License and Pricing", "ag-Grid is a feature-rich datagrid available in Free or Enterprise versions. This page describes the License and Pricing details for ag-Grid Enterprise.", true);
    ?>

    <!-- Facebook Pixel Code -->
    <script>
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return;
            n = f.fbq = function () {
                n.callMethod ?
                    n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e);
            t.async = !0;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s)
        }(window,
            document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '512303249109564'); // Insert your pixel ID here.
        fbq('track', 'PageView');
    </script>
    <noscript><img style="display:none; width: 1px; height: 1px;"
                   src="https://www.facebook.com/tr?id=512303249109564&ev=PageView&noscript=1"
        /></noscript>
    <!-- DO NOT MODIFY -->
    <!-- End Facebook Pixel Code -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

    <link rel="stylesheet" href="dist/homepage.css">
</head>

<body ng-app="index">

<!-- trackers -->
<script>
    fbq('track', 'ViewContent');
</script>

<script type="text/javascript">
    _linkedin_data_partner_id = "71830";
</script>
<script type="text/javascript">
    (function () {
        var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";
        b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);
    })();
</script>

<noscript>
    <img style="display:none; width: 1px; height: 1px;" alt=""
         src="https://dc.ads.linkedin.com/collect/?pid=71830&fmt=gif"/>
</noscript>

<header id="nav">
    <?php
    $version = 'latest';
    include './includes/navbar.php';
    ?>
</header>

<div class="page-content">
    <div class="license-pricing">
        <div id="content">
            <section class="page-info">
                <h1>ag-Grid Pricing and Licensing</h1>
            </section>
            <section class="packages">
                <div>
                    <div>
                        <img src="./images/pricing/Community.svg" style="max-width: 50px;" alt="MIT">
                    </div>
                    <div>
                        <h3>ag-Grid Community</h3>
                        <p>has the same outstanding performance as ag-Grid Enterprise and contains many essential features.<br>
                        It's completely free to use under the MIT license. We actively maintain the project but offer no support.
                        </p>
                        <div class="package-install">
                            <span>&gt; npm i ag-grid-community</span>
                            <span>downloads &gt; 150K/month</span>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/svg/enterprise.svg" style="max-width: 50px;" alt="Enterprise">
                    </div>
                    <div>
                    <h3>ag-Grid Enterprise</h3>
                    <p>
                    is a commercial license that unlocks advanced grid functionality like Row Grouping, Range Selection,
                    Master / Detail, Server Side Row Model and <a href="./javascript-grid-set-license/">more</a>. You are free to
                    download ag-Grid Enterprise to evaluate.
                    </p>
                    <p><span>&gt; npm i ag-grid-enterprise</span></p>
                    <p>
                    You don't need a license key to evaluate the grid as all features are unlocked. If you need to temporarily
                    hide the watermark and browser console errors while evaluating, please send an e-mail to <a href="mailto:info@ag-grid.com>">info@ag-grid.com</a>
                    to request an evaluation license.
                    </p>
                    <p><strong>If you are ready to begin development, please select the Enterprise product you wish to purchase from the options below.</strong></p>
                    <p>If you need more information, please scroll down for expanded definitions and FAQ responses, or e-mail our sales team at
                    <a href="mailto:info@ag-grid.com">info@ag-grid.com</a>.
                    </p>
                </div>
            </section>
            <section id="licenses">
                <div class="license-container">
                    <div class="license" style="border-color: #009ede;">
                        <div>
                            <img src="./images/pricing/SA.svg" alt="Single Application">
                            <h3>ag-Grid Enterprise</h3>
                            <h2>Single Application</h2>
                            <h3>Developer License</h3>

                        </div>
                        <h4>
                            &dollar;750.<span style="font-size: small">00</span>
                            <p>1 project / 1 developer</p>
                        </h4>
                        <div>
                            <a class="btn" style="color: #009ede;border-color: #009ede" href="mailto:info@ag-grid.com">CONTACT US</a>
                        </div>
                    </div>
                    <div class="license" style="border-color: #009d70;">
                        <div>
                            <img src="./images/pricing/MA.svg" alt="Multiple Applications">
                            <h3>ag-Grid Enterprise</h3>
                            <h2>Multiple Applications</h2>
                            <h3>Developer License</h3>
                        </div>
                        <h4>
                            &dollar;1,200.<span style="font-size: small">00</span>
                            <p>unlimited projects / 1 developer</p>
                        </h4>
                        <div>
                            <a class="btn" style="color: #009d70;border-color: #009d70" href="mailto:info@ag-grid.com">CONTACT US</a>
                        </div>
                    </div>
                    <div class="license" style="border-color: #fbad18;">
                        <div>
                            <img src="./images/pricing/Deployment%20Add-on.svg" alt="Deployment License">
                            <h3>ag-Grid Enterprise</h3>
                            <h2>Deployment License</h2>
                            <h3>Add-on</h3>
                        </div>
                        <h4>
                            &dollar;750.<span style="font-size: small">00</span>
                            <p>1 project / 1 production environment</p>
                        </h4>
                        <div>
                            <a class="btn" style="color: #fbad18;border-color: #fbad18" href="mailto:info@ag-grid.com">CONTACT US</a>
                        </div>
                    </div>
                </div>
            </section>
            <section id="definitions">
                <div>
                    <div>&nbsp;</div>
                    <div style="text-decoration: underline; color: orange;">
                        <h1 style="color: black">DEFINITIONS</h1>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/Community.svg">
                    </div>
                    <div>
                        <span>Community License</span>
                        <p>
                            A license grant to use the ag-Grid Community package, which contains all of our essential features, without
                            charge under the MIT license.
                        </p>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/svg/enterprise.svg">
                    </div>
                    <div>
                        <span>Enterprise License</span>
                        <p>
                            A license grant to use the ag-Grid Enterprise package, which contains all of the features of ag-Grid Community
                            and additional enterprise features, for internal use, as a perpetual, concurrent, per developer, per application Commercial License with a 1-year
                            subscription to new versions, support and maintenance.
                        </p>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/SA.svg">
                    </div>
                    <div>
                        <span>Single Application Developer License (Enterprise)</span>
                        <p>
                            Allows one licensed Developer to use ag-Grid Enterprise in one application, for
                            internal use, in perpetuity. Includes a 1-year subscription to new versions,
                            support and maintenance. For customer-facing (external) applications, please see the Deployment
                            License Add-on.
                        </p>
                        <div class="example card">
                            <div class="card-header">Example</div>
                            <div class="card-body">
                                <div class="card-text">
                                    A development team in company &lsquo;A&rsquo; working on an application named &lsquo;MyApp&rsquo; decides to use
                                    ag-Grid Single Application Developer License. They need to purchase the number of developer license
                                    &lsquo;seats&rsquo; that equals the count of concurrent Front-End JavaScript developers working on &lsquo;MyApp&rsquo;,
                                    say 5. These 5 &lsquo;seats&rsquo; will only be available for &lsquo;MyApp&rsquo;. If company &lsquo;A&rsquo; starts
                                    working on a new application named &lsquo;NewApp&rsquo; they need to purchase a number of developer license
                                    &lsquo;seats&rsquo; that equals the count of concurrent Front-End JavaScript developers working on &lsquo;NewApp&rsquo;,
                                    say 3. That means that company &lsquo;A&rsquo; now owns 8 ag-Grid Single Application Developer Licenses: 5 for use with
                                    &lsquo;MyApp&rsquo; only and 3 for use with &lsquo;NewApp&rsquo; only.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/MA.svg">
                    </div>
                    <div>
                        <span>Multiple Applications Developer License (Enterprise)</span>
                        <p>
                            Allows one licensed developer to use ag-Grid Enterprise in an unlimited number of applications,
                            for internal use, in perpetuity. Includes a 1-year subscription to new versions,
                            support and maintenance. For customer-facing (external) applications, please see the Deployment
                            License Add-on.
                        </p>
                        <div class="example card">
                            <div class="card-header">Example</div>
                            <div class="card-body">
                                <div class="card-text">
                                    A development team in company &lsquo;A&rsquo; working on an application named
                                    &lsquo;MyApp&rsquo; decides to use ag-Grid Multiple Applications Developer License. They
                                    need to purchase the number of developer license &lsquo;seats&rsquo; that equals the count
                                    of concurrent Front-End JavaScript developers working on &lsquo;MyApp&rsquo;, say 5. If
                                    company &lsquo;A&rsquo; starts working on a new application named &lsquo;NewApp&rsquo; they
                                    can freely move developers between the two projects, assuming the total concurrent count of
                                    &lsquo;seats&rsquo; is not exceeded. That means that company &lsquo;A&rsquo; owns 5 ag-Grid
                                    Multiple Application Developer Licenses available to use with &lsquo;MyApp&rsquo;,
                                    &lsquo;NewApp&rsquo; and any other project so long as the concurrent licensed developer count
                                    is not exceeded.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/Deployment%20Add-on.svg">
                    </div>
                    <div>
                        <span>Deployment License Add-on (Enterprise)</span>
                        <p>
                            Allows licensed developers to sub-license ag-Grid for one application on one production environment
                            in perpetuity. Includes a 1-year subscription to new versions, support and maintenance. Only available
                            with a Developer License.
                        </p>
                        <div class="example card">
                            <div class="card-header">Example 1</div>
                            <div class="card-body">
                                <div class="card-text">
                                    Company &lsquo;A&rsquo; deploys &lsquo;MyApp&rsquo; as a SaaS offering on a multi-tenant cloud
                                    instance. It's replicated for performance across 5 Availability Zones and accessed by hundreds
                                    of thousands of customers. Company &lsquo;A&rsquo; needs a single Deployment License Add-on to
                                    cover the single production environment, irrespective of the quantity of resources available to
                                    the app. Development, Testing, Build, Integration, Staging, etc. environments are not counted.
                                </div>
                            </div>
                        </div>
                        <div class="example card">
                            <div class="card-header">Example 2</div>
                            <div class="card-body">
                                <div class="card-text">
                                    A customer of company &lsquo;A&rsquo;, company &lsquo;B&rsquo;, requests a version of &lsquo;MyApp&rsquo;
                                    to run on their private infrastructure. Company &lsquo;A&rsquo; deploys &lsquo;MyApp&rsquo; to a datacentre
                                    controlled by Company &lsquo;B&rsquo;. Company &lsquo;A&rsquo; needs one Deployment License Add-on to cover
                                    its SaaS offering (Example 1) and one Deployment License Add-on to cover the &lsquo;on-premise&rsquo;
                                    deployment to Company &lsquo;B&rsquo;, irrespective of the quantity of resources available to the app.
                                    Development, Testing, Build, Integration, Staging, etc. environments are not counted.
                                </div>
                            </div>
                        </div>
                        <div class="example card">
                            <div class="card-header">Example 3</div>
                            <div class="card-body">
                                <div class="card-text">
                                    Company &lsquo;C&rsquo; approaches company &lsquo;A&rsquo; with a request to deploy &lsquo;MyApp&rsquo;
                                    across 50 locations, each with their own infrastructure. Company &lsquo;A&rsquo; would need one Deployment
                                    License Add-on to cover its SaaS offering (Example 1), one Deployment License Add-on to cover the
                                    &lsquo;on-premise&rsquo; deployment to Company &lsquo;B&rsquo; (Example 2) and fifty Deployment License Add-ons
                                    to cover the &lsquo;on-premise&rsquo; deployment to Company &lsquo;C&rsquo;, irrespective of the quantity of
                                    resources available to the app in a location. Development, Testing, Build, Integration, Staging, etc. environments
                                    are not counted.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="deeper-dive">
                <div>
                    <div>&nbsp;</div>
                    <div style="text-decoration: underline; color: red;">
                        <h1 style="color: black">DEEPER DIVE</h1>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/Dependency.svg">
                    </div>
                    <div>
                        <span>Project Dependency</span>
                        <p>A software project will have a dependency on ag-Grid Enterprise if it requires our software to
                            perform some of its functions. Every Front-End JavaScript developer working on the project will need
                            to be licensed.
                        </p>
                        <div class="example card">
                            <div class="card-header">Example</div>
                            <div class="card-body">
                                <div class="card-text">
                                    Company &lsquo;A&rsquo; is developing an application named &lsquo;MyApp&rsquo;. The app needs to render
                                    10K rows of data in a table and allow users to group, filter and sort. The dev team adds ag-Grid Enterprise
                                    to the project to satisfy that requirement. 5 Front-End and 10 Back-End developers are working on
                                    &lsquo;MyApp&rsquo;. Only 1 Front-End developer is tasked with configuring and modifying the data grid.
                                    The benefit to the UI is project-wide however and all developers contributing to it need to be licensed.
                                    Company &lsquo;A&rsquo; purchases 5 licenses for ag-Grid Enterprise.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/Indirect.svg">
                    </div>
                    <div>
                        <span>Indirect Project Dependency</span>
                        <p>
                            A software project will have an indirect dependency on ag-Grid Enterprise even if it's wrapped into
                            another framework, file, library, etc. Every Front-End JavaScript developer working on a project using
                            a library that wraps ag-Grid Enterprise will need to be licensed.
                        </p>
                        <p>Please note: You are not allowed to wrap ag-Grid Enterprise in a framework, library, component, etc. and
                            make it available as a development tool outside of your organisation.
                        </p>
                        <div class="example card">
                            <div class="card-header">Example</div>
                            <div class="card-body">
                                <div class="card-text">
                                    A UI development team at Company &lsquo;A&rsquo; creates its own UI library for internal development
                                    and includes ag-Grid Enterprise as a component. The team working on &lsquo;MyApp&rsquo; uses the new
                                    library and so does the team working on &lsquo;NewApp&rsquo;. &lsquo;MyApp&rsquo; has 5 Front-End
                                    JavaScript developers and &lsquo;NewApp&rsquo; has 3. There are 2 Front-End JavaScript developers on
                                    the UI development team. Company &lsquo;A&rsquo; purchases 10 licenses for ag-Grid Enterprise.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                    <img src="./images/svg/production.svg">
                    </div>
                    <div>
                        <span>Production Environment</span>
                        <p>A software project will have an indirect dependency on the ag-Grid Enterprise package event if it's wrapped into
                        another framework, file, library, etc. Every concurrent Front-End, JavaScript developer working on a project using
                        a library that wraps the ag-Grid Enterprise package will need to be licensed.</p>
                        <div class="example card">
                            <div class="card-header">Example</div>
                            <div class="card-body">
                                <div class="card-text">
                                    A UI development team at Company &lsquo;A&rsquo; creates its own UI library for internal development and includes ag-Grid
                                    Enterprise as a component. The team working on &lsquo;MyApp&rsquo; uses the new library and so does the team working on
                                    &lsquo;NewApp&rsquo;. &lsquo;MyApp&rsquo; has 5 Front-End JavaScript developers and &lsquo;NewApp&rsquo; has 3.
                                    There are 2 Front-End JavaScript developers on the UI development team. Company &lsquo;A&rsquo; purchases 10 licenses for
                                    ag-Grid Enterprise.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="timeline">
                <div>
                    <div>&nbsp;</div>
                    <div style="text-decoration: underline; color: magenta;">
                        <h1 style="color: black">LICENSE TIMELINE</h1>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/Perpetual.svg">
                    </div>
                    <div>
                        <span>Perpetual License</span>
                        <p>
                            When you purchase ag-Grid Enterprise you are granted a license to use a version of the product in
                            perpetuity. There are no further charges until you choose to extend your license to cover newer
                            versions (see next point).
                        </p>
                        <p>Please note that while use of the software is perpetual, Support and Corrective Maintenance are not. We
                            do not provide issue resolution to versions of ag-Grid Enterprise older than 12 months. We roll bug fixes,
                            performance enhancements and other improvements into new releases; we don't patch, fix or in any way
                            alter older versions.
                        </p>
                        <div class="example card">
                            <div class="card-header">Example</div>
                            <div class="card-body">
                                <div class="card-text">
                                    Company &lsquo;A&rsquo; is developing an application named &lsquo;MyApp&rsquo;. The app needs to render 10K rows of data
                                    in a table and allow users to group, filter and sort. The dev team adds ag-Grid Enterprise to the project to satisfy that
                                    requirement. 5 Front-End and 10 Back-End developers are working on &lsquo;MyApp&rsquo;.
                                    Only 1 Front-End developer is tasked with configuring and modifying the data grid. The benefit to
                                    the UI is project wide however and all developers contributing to it need to be licensed. Company
                                    &lsquo;A&rsquo; purchases 5 licenses for ag-Grid Enterprise.
                                </div>
                            </div>
                        </div>
                        <div>
                            <img src="./images/pricing/Version%201.svg">
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/1-year.svg">
                    </div>
                    <div>
                        <span>1-year Subscription to New Versions (included)</span>
                        <p>When you make a purchase you get a Subscription to license new versions of ag-Grid Enterprise for 365 days.
                            You can see our release list <a href="./ag-grid-changelog/">here</a>. After 365 days you will no longer be able to license the latest versions
                            of ag-Grid Enterprise without renewing your subscription. You can continue to use your licensed versions
                            in perpetuity.
                        </p>
                        <p>
                            Please note that while use of the software is perpetual, Support and Corrective Maintenance are not. We
                            do not provide issue resolution to versions of ag-Grid Enterprise older than 12 months. We roll bug fixes,
                            performance enhancements and other improvements into new releases; we don't patch, fix or in any way
                            alter older versions.
                        </p>
                        <div>
                            <img src="./images/pricing/Versions%202.svg">
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <img src="./images/pricing/Renewal%20icon.svg">
                    </div>
                    <div>
                        <span>Subscription Renewal (optional)</span>
                        <p>
                            You can choose to renew your subscription to license new versions of ag-Grid Enterprise at a
                            discounted rate. This could range from 365 days up to a 5-year term. At the end of your subscription
                            period you will no longer be able to license the latest versions of ag-Grid Enterprise without renewing.
                            You can continue to use your licensed versions in perpetuity.
                        </p>
                        <p>
                            Please note that while use of the software is perpetual Support, and Corrective Maintenance are not. We
                            do not provide issue resolution to versions of ag-Grid Enterprise older than 12 months. We roll bug fixes,
                            performance enhancements and other improvements into new releases; we don't patch, fix or in any way
                            alter older versions.
                        </p>
                        <div>
                            <img src="./images/pricing/Versions%203.svg">
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        &nbsp;
                    </div>
                    <div>
                        <span>Support (only with an active subscription)</span>
                        <p>
                            We offer a log-in protected support portal that has a vast knowledge base and access to
                            our ticketing system. We aim to respond to support requests within 24 hours. We operate on business days
                            only, between 9am and 5pm GMT.
                        </p>
                    </div>
                </div>
                <div>
                    <div>
                        &nbsp;
                    </div>
                    <div>
                        <span>Corrective maintenance (only with an active subscription)</span>
                    </div>
                </div>
            </section>
        </div>
    <!--        <div id="side-bar">-->
        <div id="side-bar" style="display: none">
            <div style="margin: 1rem; position: fixed; top: 65px;">
                <div style="border: 1px solid rgba(0, 0, 0, 0.125); border-radius: 0.25rem; background-color: #f8f9fa;display: flex; flex-direction: column; align-items: center">
                    <div style="flex: 1 1 auto; margin: 1rem">
                        <img src="./images/pricing/SA.svg" style="min-width: 50px; max-width: 50px;">
                    </div>
                    <div style="flex: 1 1 auto;">
                        &dollar;750
                    </div>
                    <div style="flex: 1 1 auto; margin: 1rem">
                        <a class="btn" style="color: #009ede;;border-color: #009ede;" href="mailto:info@ag-grid.com">CONTACT US</a>
                    </div>
                </div>
                <div style="border: 1px solid rgba(0, 0, 0, 0.125); border-radius: 0.25rem; background-color: #f8f9fa;display: flex; flex-direction: column; align-items: center; margin-top: 1rem">
                    <div style="flex: 1 1 auto; margin: 1rem">
                        <img src="./images/pricing/MA.svg" style="min-width: 55px; max-width: 55px;">
                    </div>
                    <div style="flex: 1 1 auto;">
                        &dollar;1,200
                    </div>
                    <div style="flex: 1 1 auto; margin: 1rem">
                        <a class="btn" style="color: #009d70;border-color: #009d70;" href="mailto:info@ag-grid.com">CONTACT US</a>
                    </div>
                </div>
                <div style="border: 1px solid rgba(0, 0, 0, 0.125); border-radius: 0.25rem; background-color: #f8f9fa;display: flex; flex-direction: column; align-items: center; margin-top: 1rem">
                    <div style="flex: 1 1 auto; margin: 1rem">
                        <img src="./images/pricing/Deployment%20Add-on.svg" style="min-width: 55px; max-width: 55px;">
                    </div>
                    <div style="flex: 1 1 auto;">
                        &dollar;750
                    </div>
                    <div style="flex: 1 1 auto; margin: 1rem">
                        <a class="btn" style="color: #fbad18;border-color: #fbad18;" href="mailto:info@ag-grid.com">CONTACT US</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php include_once("./includes/footer.php"); ?>
</div>
<?php include_once("./includes/analytics.php"); ?>
<script>
    if (window.location.href.indexOf("/community-support.php?submitted=true") !== -1) {
        (new Image()).src = "//www.googleadservices.com/pagead/conversion/873243008/?label=8TOnCM7BnWsQgMOyoAM&guid=ON&script=0";
    }

    function getRect(element) {
        const bounds = element.offset();
        bounds.right = bounds.left + element.outerWidth();
        bounds.bottom = bounds.top + element.outerHeight();
        return bounds;
    }

    function getCurrentViewPort() {
        const viewport = {
            top: win.scrollTop(),
            left: win.scrollLeft(),
            right: NaN,
            bottom: NaN
        };

        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();

        return viewport;
    }

    var win = jQuery(window);
    var scroller = jQuery('.page-content')[0];

    function trackIfInViewPort(element, leeway, callback) {
        function comparePosition() {
            var viewPort = getCurrentViewPort();
            var box = getRect(element);
            var inViewPort = viewPort.bottom >= box.top && viewPort.top <= (box.bottom - leeway);

            callback(inViewPort);
        }

        comparePosition();
        scroller.addEventListener('scroll', comparePosition);
    }

    function positionAndToggleSideBar(inViewPort) {
        var pricingNav = jQuery('#side-bar');
        var licenses = jQuery('#licenses');

        var viewPort = getCurrentViewPort();

        pricingNav.offset({top: viewPort.top, left: licenses.offset().left + licenses.width() + 100});
        inViewPort ? pricingNav.fadeOut() : pricingNav.fadeIn();
    }

    // allow for a little margin leeway - looks nicer
    var leeway = 25;
    trackIfInViewPort(jQuery('#licenses'), leeway, positionAndToggleSideBar);
</script>
<script src="dist/homepage.js"></script>
</body>
</html>
