/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global require, exports */
const fs = require("fs");

const chrome = require("selenium-webdriver/chrome");
const { Builder } = require("selenium-webdriver");

const SCRIPTS = [
	"../lib/single-file/util/doc-util.js",
	"../lib/single-file/util/doc-helper.js",
	"../lib/single-file/vendor/css-tree.js",
	"../lib/single-file/vendor/html-srcset-parser.js",
	"../lib/single-file/vendor/css-minifier.js",
	"../lib/single-file/vendor/css-font-property-parser.js",
	"../lib/single-file/vendor/css-media-query-parser.js",
	"../lib/single-file/modules/html-minifier.js",
	"../lib/single-file/modules/css-fonts-minifier.js",
	"../lib/single-file/modules/css-fonts-alt-minifier.js",
	"../lib/single-file/modules/css-matched-rules.js",
	"../lib/single-file/modules/css-medias-alt-minifier.js",
	"../lib/single-file/modules/css-rules-minifier.js",
	"../lib/single-file/modules/html-images-alt-minifier.js",
	"../lib/single-file/modules/html-serializer.js",
	"../lib/single-file/single-file-core.js",
	"../lib/single-file/single-file-browser.js"
];

exports.getPageData = async options => {
	let driver;
	try {
		const builder = new Builder();
		builder.setChromeOptions(new chrome.Options().headless().addArguments("--disable-web-security"));
		driver = await builder.forBrowser("chrome").build();
		await driver.get(options.url);
		if (options.loadDeferredImages) {
			SCRIPTS.unshift("../lib/lazy/web/web-lazy-loader-before");
		}
		const scripts = await Promise.all(SCRIPTS.map(scriptPath => fs.readFileSync(require.resolve(scriptPath)).toString()));
		driver.executeScript(scripts.join("\n"));
		const pageData = await driver.executeAsyncScript(getPageDataScript(), options);
		return pageData;
	} finally {
		if (driver) {
			driver.quit();
		}
	}
};

function getPageDataScript() {
	return `
	const [options, callback] = arguments;
	getPageData().then(pageData => callback(pageData))

	async function getPageData() {
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;		
		options.removeFrames = true;
		options.doc = document;
		options.win = window;
		const SingleFile = SingleFileBrowser.getClass();
		const singleFile = new SingleFile(options);
		await singleFile.initialize();
		await singleFile.run();
		return singleFile.getPageData();			
	}
	`;
}