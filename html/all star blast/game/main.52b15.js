window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;
    
    let { RESOURCES, INTERNAL, MAIN, START_SCENE } = cc.AssetManager.BuiltinBundleName;
    function setLoadingDisplay () {
        var splash = document.getElementById('splash');
        splash.style.display = 'flex';
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    var onStart = function () {
        var tempEvent = {};
        tempEvent.name = 'loading_projectcodeLoaded';
        tempEvent.param = {
            "checker": window.funnel.checker,
            "totalSec": Date.now() - window.funnel.startTime,	
            "clientTimestamp":Date.now(),
            "gameVersion": window.versionInfo.gameVersion,
            "deploymentEnvironment":  window.versionInfo.deploymentEnvironment
        }
        window.trackingFunnelEvents.push(tempEvent);     

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
		cc.assetManager.downloader.maxConcurrency = 64;
        cc.assetManager.downloader.maxRequestsPerFrame = Number.MAX_VALUE;
		cc.assetManager.presets['scene'].maxConcurrency = 64;
        cc.assetManager.presets['scene'].maxRequestsPerFrame = Number.MAX_VALUE;
		cc.assetManager.presets['preload'].maxConcurrency = 64;
        cc.assetManager.presets['preload'].maxRequestsPerFrame = Number.MAX_VALUE;
        // if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        //     cc.assetManager.downloader.maxConcurrency = 4;
        //     cc.assetManager.downloader.maxRequestsPerFrame = Number.MAX_VALUE;
		// 	cc.assetManager.presets['scene'].maxConcurrency = 4;
		// 	cc.assetManager.presets['scene'].maxRequestsPerFrame = Number.MAX_VALUE;
		// 	cc.assetManager.presets['preload'].maxConcurrency = 4;
		// 	cc.assetManager.presets['preload'].maxRequestsPerFrame = Number.MAX_VALUE;
        // }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });


        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );

    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({ 
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });
    
    let bundleRoot = [INTERNAL, MAIN];
    settings.hasStartSceneBundle && bundleRoot.push(START_SCENE);
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb (err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.game.run(option, onStart);
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);

    for (let i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.13ade.js');
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/engine/index.js');
    }
    else {
        require('src/settings.13ade.js');
        require('src/cocos2d-jsb.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}

if ('serviceWorker' in navigator) {
    //console.log("Service worker registration success!")
    navigator.serviceWorker.register('service-worker.js');
  }

try {
    if (!window.parent || !window.parent.deferredPrompt) {
        window.addEventListener('beforeinstallprompt', function(e) {
            //console.log('👍', 'beforeinstallprompt-listened');
            e.preventDefault();
            // Stash the event so it can be triggered later.
            window.deferredPrompt = e;
        });
    }
} catch (e) {
}