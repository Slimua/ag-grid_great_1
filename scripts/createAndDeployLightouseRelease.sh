#!/usr/bin/env bash

ZIP_PREFIX=`date +%Y%m%d`

cd packages/ag-grid-docs
npx gulp release
cd dist

FILENAME=release_"$ZIP_PREFIX"_v"$ZIP_PREFIX".zip
zip -r ../../../$FILENAME *

cd ../../../

rm -rf /var/www/html/*
mv $FILENAME /var/www/html/
unzip /var/www/html/$FILENAME -d /var/www/html/

mkdir /var/www/html/lighthouse/

npx lighthouse http://teamcity.ag-grid.com  --chrome-flags="--headless" --output json --output-path /var/www/html/lighthouse/report.json
