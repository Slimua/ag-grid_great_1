<?php
include 'utils.php';
$example = getExampleInfo('react');
$generated = isset($_GET['generated']);
if ($generated) { 
    echo "<!DOCTYPE html>\n";
};
?>
<html lang="en">
<head>
    <title>ag-Grid React Example</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style media="only screen">
        html, body, #root {
        height: 100%;
        width: 100%;
        margin: 0;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
    }
    html {
        position: absolute;
        top: 0;
        left: 0;
        padding: 0;
        overflow: auto;
    }
    body {
        padding: 1rem;
        overflow: auto;
    }
    </style>
<?php renderExampleExtras($_GET); ?>
<?php renderStyles($example['styles']); ?>
<?php renderNonGeneratedScripts($example['scripts']); ?>
</head>
<body>
    <div id="root">Loading ag-Grid React example&hellip;</div>
    
    <script>
        var appLocation = '<?= $example['appLocation'] ?>';
        var boilerplatePath = '<?= $example['boilerplatePath'] ?>';
        var systemJsMap = <?= json_encode($systemJsMap); ?>;
        <?php
        // only used in archives/production
        if ($example['gridSettings']['enterprise']) {
        ?>
        var systemJsPaths = <?= json_encode($systemJsEnterprisePaths) ?>;
        <?php
        } else {
        ?>
        var systemJsPaths = <?= json_encode($systemJsCommunityPaths) ?>;
        <?php
        }
        ?>
    </script>

    <script src="https://unpkg.com/systemjs@0.19.39/dist/system.src.js"></script>
    <!-- leave the next line as is - is replaced when deploying to archives or production -->
    <script src="<?=$example['boilerplatePath']?>systemjs.config.js"></script>

    <script>
      System.import('<?=$example['appLocation']?>index.jsx').catch( function(err) { console.error(err); })
    </script>
</body>
</html>
