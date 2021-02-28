// babylon core
const BABYLON = require('babylonjs');
// babylon gui
require('babylonjs-gui');
// babylon materials
require('babylonjs-materials');
// obj loader
require('babylonjs-loaders');

(function () {
    const gameAuthCode = $('#gamedata').attr('data-authcode');
    /**
     * Game Data
     */
    const gamedata = document.getElementById('gamedata');
    if (!gamedata) {
        window.location.href = "/game/error";
    }
    const gameId = parseInt(gamedata.getAttribute('data-gameid'), 10);
    if (!gameId || isNaN(gameId)) {
        window.location.href = "/game/error";
    }
    let gameServerId = 0;

    // Join Game

    let wsurl = "wss://" + window.location.host + "/game-sockets/websocket.aspx";
    if (window.location.protocol === 'http:') {
        wsurl = "ws://localhost:8080/game-sockets/websocket.aspx";
    }


    var isTrying = false;

    function attemptRetry(closeEvent) {
        if (!isTrying) {
            isTrying = true;
            setTimeout(function () {
                setupListen();
                isTrying = false;
            }, 1500);
        }
    }

    function handleWsMessage(event) {

    }

    function setupListen() {
        var sock = new WebSocket(wsurl + '?gameAuth=' + gameAuthCode);
        sock.onmessage = function (event) {
            handleWsMessage(event)
        }
        sock.onopen = function (event) {
            handleWsMessage(event)
            // Connect to game
            sock.send(JSON.stringify({
                cmd: 'join',
                gameId: gameId,
            }));
        }
        sock.onclose = function (event) {
            alert('Connection to the Game Server has been lost.');
            window.location.reload();
        }
        sock.onerror = function (event) {
            alert('Connection to the Game Server has been lost.');
            window.location.reload();
        }
        window.onbeforeunload = function () {
            sock.close();
        }
    }

    setupListen()

    /*
request('/game/'+gameId+'/join?authCode='+gameAuthCode, 'POST', JSON.stringify({}))
    .then((d) => {
        gameServerId = d.serverId;
        // Setup WSS here
    }).catch((e) => {
        alert(e.responseJSON.message);
        window.location.href = "/";
    });
    */

    /**
     * Global Babylon Vars
     */
    BABYLON.OBJFileLoader = BABYLON.OBJFileLoader || {}
    BABYLON.OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;

    // Converts from degrees to radians.
    Math.radians = function (degrees) {
        return degrees * Math.PI / 180;
    };

    // Converts from radians to degrees.
    Math.degrees = function (radians) {
        return radians * 180 / Math.PI;
    };

    function rotateVector(vect, quat) {
        var matr = new BABYLON.Matrix();
        quat.toRotationMatrix(matr);
        var rotatedvect = BABYLON.Vector3.TransformCoordinates(vect, matr);
        return rotatedvect;
    }

    window.addEventListener('DOMContentLoaded', function () {
        // Canvas
        var canvas = document.getElementById('renderCanvas');
        // Game Engine
        var engine = new BABYLON.Engine(canvas, true);
        // Create Scene
        var createScene = function () {
            var scene = new BABYLON.Scene(engine);
            window.scene = scene;
            // Use Right Handed (since I believe it's what blender uses)
            scene.useRightHandedSystem = true;

            var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
            var physicsPlugin = new BABYLON.AmmoJSPlugin();
            scene.enablePhysics(gravityVector, physicsPlugin);
            // Setup Player Camera
            var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 4, Math.PI / 6, 45, new BABYLON.Vector3(0, 10, -10), scene);
            camera.maxZ = 100000;
            camera.angularSensibilityX = 2500;
            camera.angularSensibilityY = 2500;
            camera.panningSensibility = 2500;
            camera.checkCollisions = true;
            camera.wheelPrecision = 10;
            camera.useInputToRestoreState = true;

            camera.allowUpsideDown = false;
            // Attach the camera to the canvas.
            camera.attachControl(canvas, false);
            camera.useBouncingBehavior = false;
            camera.useAutoRotationBehavior = false;
            camera.useFramingBehavior = false;

            // Create a basic light, aiming 0,1,0 - meaning, to the sky.
            var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 1;

            // Skybox
            var skybox = BABYLON.Mesh.CreateBox("BackgroundSkybox", 2048, scene, undefined, BABYLON.Mesh.BACKSIDE);

            // Create and tweak the background material.
            var backgroundMaterial = new BABYLON.BackgroundMaterial("backgroundMaterial", scene);
            backgroundMaterial.reflectionTexture = new BABYLON.CubeTexture("https://cdn.ubexs.com/game/default_assets/TropicalSunnyDay", scene);
            backgroundMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skybox.material = backgroundMaterial;


            // ...
            // IMPORT MAP HERE

            console.log("Base URL", window.HTTPMeta);

            fetch(window.HTTPMeta.baseUrl + '/api/v1/game/' + gameId + '/map?authCode=' + gameAuthCode, {
                credentials: 'omit',
                mode: 'cors'
            }).then((d) => {
                return d.text();
            }).then((d) => {
                // Function(`let gameMap = new ${simpleCryptoData.name}("${GAME_KEY}").decrypt("${d}"); Function(gameMap)(scene);`)(scene);
                let mapString = eval(`new ${simpleCryptoData.name}("${GAME_KEY}").decrypt("${d}")`);
                if (mapString) {
                    Function(mapString)(scene);
                }
            });


            fetch(window.HTTPMeta.baseUrl + '/api/v1/game/' + gameId + '/scripts?authCode=' + gameAuthCode, {
                credentials: 'omit',
                mode: 'cors'
            }).then((d) => {
                return d.text();
            }).then((d) => {
                let scriptsString = eval(`new ${simpleCryptoData.name}("${GAME_KEY}").decrypt("${d}")`);
                if (scriptsString) {
                    Function(scriptsString)(scene);
                }
            });

            // ...

            // char system

            // old light (doesnt support shadows)
            // new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 50, 0), scene);

            // light1
            // light1
            var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -1, 0), scene);
            light.position = new BABYLON.Vector3(20, 40, 20);
            light.intensity = 1;

            // Shadows
            var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
            shadowGenerator.useExponentialShadowMap = true;

            var hull;
            scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;

            // var colorfogwater = new BABYLON.Color3(10 / 255, 80 / 255, 130 / 255);  // blue underwater

            var colorfogAmbient = new BABYLON.Color3(0.8, 0.8, 0.9);

            // let ref = new BABYLON.Mesh.CreateBox('ref', 10, scene)




            // skybox
            var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
            var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://cdn.ubexs.com/game/default_assets/TropicalSunnyDay", scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;



            // Collisions
            scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
            scene.collisionsEnabled = true;

            scene.fogColor = colorfogAmbient;
            scene.fogDensity = 0.008;

            var mat = new BABYLON.StandardMaterial("mat1", scene);
            mat.alpha = 0.8;
            mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
            mat.emissiveColor = new BABYLON.Color3.Black();
            mat.backFaceCulling = false;

            /**
             * @type {BABYLON.Mesh}
             */
            var hrp = 0;


            // Define ground shape
            /**
             * @type {BABYLON.Mesh}
             */
            const ground = new BABYLON.Mesh.CreateGround('ground', 500, 500, 1, scene);
            const groundImposter = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor);
            ground.checkCollisions = true;
            ground.receiveShadows = true;
            var groundMat = new BABYLON.StandardMaterial("groundMaterial", scene);
            // groundMat.diffuseTexture = new BABYLON.Texture("https://cdn.ubexs.com/game/default_assets/Concrete.jpg", scene);
            groundMat.diffuseTexture = new BABYLON.Texture('https://cdn.ubexs.com/game/default_assets/default_stud.png', scene);
            groundMat.diffuseTexture.uScale = 800;
            groundMat.diffuseTexture.vScale = 800;
            groundMat.diffuseTexture.alpha = 0.5;
            groundMat.diffuseTexture.hasAlpha = true;
            groundMat.opacityFresnel = false;
            ground.material = groundMat;

            const groundBgLayer = new BABYLON.Mesh.CreateGround('ground_bg', 500, 500, 1, scene);
            groundBgLayer.checkCollisions = false;
            groundBgLayer.receiveShadows = true;
            groundBgLayer.material = new BABYLON.StandardMaterial('groundMaterialBg',scene);
            groundBgLayer.material.diffuseColor = new BABYLON.Color3(179 / 255, 179 / 255, 179 / 255);
            groundBgLayer.material.hasAlpha = false;

            /**
             * @type {BABYLON.Mesh}
             */
            var leftLeg;
            /**
             * @type {BABYLON.Mesh}
             */
            var rightLeg;

            /**
             * @type {BABYLON.Mesh}
             */
            var torso;

            /**
             * @type {BABYLON.Mesh}
             */
            var leftArm;

            /**
             * @type {BABYLON.Mesh}
             */
            var rightArm;

            var genericMeshArray = [];

            function MakeCapsule(width, height, detail, readyCallback) {

                BABYLON.SceneLoader.ImportMesh("", "https://cdn.ubexs.com/game/default_assets/", "Player.obj", scene, function (meshes) {
                    // scene.createDefaultCameraOrLight(true, true, true);
                    // scene.createDefaultEnvironment();
                    meshes.forEach(msh => {
                        console.log('[info] [character] loading',msh.name);
                        genericMeshArray.push(msh)
                    });

                    readyCallback();
                });

            }

            MakeCapsule(7, 40, 20, () => {

                /**
                 * @type {BABYLON.Mesh}
                 */
                var submarine = undefined;
                submarine = BABYLON.Mesh.MergeMeshes(genericMeshArray, true, true, undefined, false, true);
                submarine.setPositionWithLocalVector(new BABYLON.Vector3(0, 3, 0));

                shadowGenerator.addShadowCaster(submarine);

                var mergedMeshesPhysics = new BABYLON.PhysicsImpostor(submarine, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 500 });
                submarine.checkCollisions = true;

                var helper = scene.createDefaultEnvironment();
                helper.setMainColor(BABYLON.Color3.Teal());
                camera.lockedTarget = submarine;
                let isWPressed = false;
                let isAPressed = false;
                let isSPressed = false;
                let isDPressed = false;
                let isSpacePressed = false;

                let spacePressIndex = 0;

                document.addEventListener
                (
                    'keydown',
                    (e) => {
                        if (e.keyCode == 87) { isWPressed = true; }
                        if (e.keyCode == 65) { isDPressed = true; }
                        if (e.keyCode == 83) { isSPressed = true; }
                        if (e.keyCode == 68) { isAPressed = true; }
                        if (e.keyCode === 32) { isSpacePressed = true; }
                    }
                );

                document.addEventListener
                (
                    'keyup', (e) => {
                        if (e.keyCode == 87) { isWPressed = false; }
                        if (e.keyCode == 65) { isDPressed = false; }
                        if (e.keyCode == 83) { isSPressed = false; }
                        if (e.keyCode == 68) { isAPressed = false; }
                        if (e.keyCode === 32) { isSpacePressed = false; spacePressIndex = 0; }
                    }
                );


                scene.registerBeforeRender(function () {
                    if (!scene.isReady()) { return; }


                    if (isWPressed || isSPressed) {
                        /*
                        // idk what these are for...
                        var playerSpeed = 0.1;
                        var gravity = 0;
                        var x = playerSpeed * parseFloat(Math.sin(submarine.rotation.x));
                        var z = playerSpeed * parseFloat(Math.cos(submarine.rotation.y));
                        */
                        if (isWPressed == true) {
                            //playerMesh.locallyTranslate(new BABYLON.Vector3(0, 0, 0.1));
                            //var forwards = submarine.forward.clone().scale(0.1);
                            var forwards = submarine.right.clone().scale(0.1);
                            submarine.moveWithCollisions(forwards);
                            submarine.addRotation(0,0,0);
                        }
                        if (isSPressed == true) {
                            //playerMesh.locallyTranslate(new BABYLON.Vector3(0, 0, -0.1));
                            //var backwards = submarine.forward.clone().scale(-0.1);
                            var backwards = submarine.right.clone().scale(-0.1);
                            submarine.moveWithCollisions(backwards);
                            submarine.addRotation(0,0,0);
                        }
                    }
                    if (isAPressed == true) {
                        submarine.addRotation(0, -0.05, 0);
                    }
                    if (isDPressed == true) {
                        submarine.addRotation(0, 0.05, 0);
                    }
                    if (isSpacePressed) {
                        if (spacePressIndex < 100) {
                            // spacePressIndex += 0.1;
                            var forwards = submarine.right.clone().scale(0);
                            forwards.y += 25;
                            submarine.moveWithCollisions(forwards);
                        }
                    }
                });

            });

            // Return the created scene.
            return scene;
        };
        var scene = createScene();
        engine.runRenderLoop(function () {
            scene.render();
        });
        window.addEventListener('resize', function () {
            engine.resize();
        });
    });
})()
