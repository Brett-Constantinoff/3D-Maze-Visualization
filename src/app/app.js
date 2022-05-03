class App{
    constructor(){
        this.initState();
    }

    //initialize our application
    initState(){
        console.log("Initializing application");
    
        //get current canvas 
        const canvas = document.querySelector("#mazeVisualizer");
    
        //init webgl
        var gl = canvas.getContext("webgl2");
    
        // Only continue if WebGL2 is available and working
        if (gl === null) {
            alert("ERROR INITIALIZING WEBGL!");
        }
    
        //the state of this application
        this.state = {
            context: gl,
            canvas: canvas,
            time: 0,
            deltaTime: 0,
            maze: {
                needsGenerating: false,
                needsClearing: false,
                mazeIndex: 0,
                start: null,
                width: 50,
                height: 50,
                dfs:{
                    colour: vec3.fromValues(0.93, 0.58, 0.30),
                    getOrder: false,
                    dfsOrder: [],
                    dfsIndex: 0,
                    isSolved: false,
                },
                bfs: {
                    colour: vec3.fromValues(0.53, 0.35, 0.65),
                    getOrder: false,
                    bfsOrder: [],
                    bfsIndex: 0,
                    isSolved: false,
                }

            },
            buttons: {
                reset: null,
                generate: null,
                solve: {
                    bfs: null,
                    dfs: null,
                }
            },
            flags: {
                reset: false,
                generate: false,
                solve: {
                    bfs: false,
                    dfs: false,
                }
            },
            camera: null,
            objects: {
                plane: null,
                lights: [],
                cubes: [],
                deRendered: [],
                deRenderedIndex: 0,
                wallList: [],
                lastWall: null,
            },
            shader: null,
        };
        console.log("Initialization finished\n");
    }

    //runs once on app startup
    //you can add new objects to render here as well and perform 
    //any intitial updates 
    onStart(){
        console.log("Starting application\n");

        //initialize our state objects
        this.state.shader = new MazeShader(this.state.context);
        this.state.objects.plane =  new Plane(this.state.maze.width, this.state.maze.height, this.state.context, this.state.shader, vec3.fromValues(0.0, 0.0, 0.0));  
        this.state.objects.lights.push(new Light("SceneLight", vec3.fromValues(this.state.maze.width / 2, 10.0 ,this.state.maze.height / 2), vec3.fromValues(1.0, 1.0, 1.0), 1.5, 0.));
        
        //add the maximum amount of cubes
        var translation = vec3.fromValues(0.0, 0.1, 0.0)
        for(var i = 0; i < this.state.maze.width; i++){
            for(var j = 0; j < this.state.maze.width ; j++){
                var name = "Cube " + ( (i * this.state.maze.width) + j);
                var cube =  new Cube(name, this.state.context, this.state.shader, vec3.fromValues(0.0, 0.0, 1.0));

                cube.translate(translation);
                this.state.objects.cubes.push(cube);
                translation[0] += 1.0;
            }
            translation[2] += 1.0;
            translation[0] = 0.0;
        }

        //determine neightbours
        //any corner has 2 neightbours
        //any edge other than a corner has 3 neighbours
        //any other cube has 4
        for(var i = 0; i < this.state.maze.height; i++){
            for(var j = 0; j < this.state.maze.width ; j++){
                var index = (i * this.state.maze.width) + j;
                var cube = this.state.objects.cubes[index];

                //bottom left corner
                if( index === 0 ){
                    cube.neighbours.push(this.state.objects.cubes[index + this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index + 1]);
                }
                //top left corner
                else if( index === this.state.maze.width - 1 ){
                    cube.neighbours.push(this.state.objects.cubes[index + this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index - 1]);
                }
                //top right corner
                else if( index === (this.state.maze.width * this.state.maze.height) - 1 ){
                    cube.neighbours.push(this.state.objects.cubes[index - this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index - 1]);

                }
                //bottom right corner
                else if( index === (this.state.maze.width * this.state.maze.height) - this.state.maze.width ){
                    cube.neighbours.push(this.state.objects.cubes[index - this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index + 1]);
                }
                //left sides
                else if( index < this.state.maze.width - 2 ){
                    cube.neighbours.push(this.state.objects.cubes[index + this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index - 1]);
                    cube.neighbours.push(this.state.objects.cubes[index + 1]);
                }
                //right sides
                else if( (this.state.maze.width * this.state.maze.height) - index - 2 < this.state.maze.width - 1){
                    cube.neighbours.push(this.state.objects.cubes[index - this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index - 1]);
                    cube.neighbours.push(this.state.objects.cubes[index + 1]);
                }
                //top side
                else if(j === this.state.maze.width - 1){
                    cube.neighbours.push(this.state.objects.cubes[index - this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index - 1]);
                    cube.neighbours.push(this.state.objects.cubes[index + this.state.maze.width]);
                }
                //bottom side
                else if(j === 0){
                    cube.neighbours.push(this.state.objects.cubes[index - this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index + 1]);
                    cube.neighbours.push(this.state.objects.cubes[index + this.state.maze.width]);

                }
                //every other cube
                else{
                    cube.neighbours.push(this.state.objects.cubes[index - this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index + 1]);
                    cube.neighbours.push(this.state.objects.cubes[index + this.state.maze.width]);
                    cube.neighbours.push(this.state.objects.cubes[index - 1]);
                }
            }
        }


        //pick the start cube and change its colour
        var index = Math.floor((this.state.maze.width * this.state.maze.height) / 2.0 + (this.state.maze.width / 2));
        this.state.maze.start = this.state.objects.cubes[index];
        this.state.maze.start.material.diffuse = vec3.fromValues(0.0, 1.0, 0.0);


        //add our camera
        this.state.camera = new Camera(vec3.fromValues(-25.5, 39.5, 26.0), vec3.fromValues(0.7, -0.7, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
  

        //get maze reset button 
        this.state.buttons.reset = document.querySelector("#resetMazeButton");
        //disbale by default
        this.state.buttons.reset.disabled = true;
        this.state.buttons.reset.addEventListener("click", () => {
            console.log("Resetting Maze..");

            //set flags
            this.state.flags.reset = true;
            this.state.flags.generate = false;
            this.state.flags.solve.dfs = false;
            this.state.flags.solve.bfs = false;

            //disbale reset
            this.state.buttons.reset.disabled = true;

            //disable solving
            this.state.buttons.solve.bfs.disabled = true;
            this.state.buttons.solve.dfs.disabled = true;

            //disable maze generation
            this.state.buttons.generate.disabled = true;
            
            //reset wall list
            this.state.objects.wallList = [];
        });

        //get maze generation button
        this.state.buttons.generate = document.querySelector("#generateMazeButton");
        this.state.buttons.generate.addEventListener("click", () => {
            console.log("Beginning Maze Generation..");

            //add the initial walls to the wall-list
            this.state.maze.start.neighbours.forEach(n => {
                this.state.objects.wallList.push(n);
            })

            //set flags
            this.state.maze.needsGenerating = true;
            this.state.flags.generate = true;
            this.state.flags.reset = false;
            this.state.flags.solve.bfs = false;
            this.state.flags.solve.dfs = false;

            //disable solving
            this.state.buttons.solve.dfs.disabled = true;
            this.state.buttons.solve.bfs.disabled = true;

            //disable generation
            this.state.buttons.generate.disabled = true;

        })

        //get the bfs solve button
        this.state.buttons.solve.bfs = document.querySelector("#bfsSolveButton");
        //disable by default
        this.state.buttons.solve.bfs.disabled = true;
        this.state.buttons.solve.bfs.addEventListener("click", () => {
            console.log("Beginning BFS..");

            //set flags
            this.state.flags.generate = false;
            this.state.flags.reset = false;
            this.state.flags.solve.bfs = true;
            this.state.flags.solve.dfs = false;

            //disable buttons
            this.state.buttons.solve.bfs.disabled = true;
            this.state.buttons.solve.dfs.disabled = true;
            this.state.buttons.generate.disabled = true;

        })

        //get the dfs solve button
        this.state.buttons.solve.dfs = document.querySelector("#dfsSolveButton");
        //disable by default
        this.state.buttons.solve.dfs.disabled = true;
        this.state.buttons.solve.dfs.addEventListener("click", () => {
            console.log("Beginning DFS..");

            //set flags
            this.state.flags.generate = false;
            this.state.flags.reset = false;
            this.state.flags.solve.bfs = false;
            this.state.flags.solve.dfs = true;

            //disable buttons
            this.state.buttons.solve.bfs.disabled = true;
            this.state.buttons.solve.dfs.disabled = true;
            this.state.buttons.generate.disabled = true
        })

    }

    //runs every frame, updating objects and moving around 
    //goes in here
    onUpdate(deltaTime){
        //update render time
        this.state.deltaTime = deltaTime;
        this.state.time += this.state.deltaTime;

        //resize the maze if neccessary
        if(this.state.maze.resize){
            this.resize();
            this.state.maze.resize = false;
        }

        //render the start maze position
        this.state.maze.start.render = true;
        this.state.maze.start.material.diffuse = vec3.fromValues(0.0, 1.0, 0.0);    

        //clear the paths of the maze
        if(this.state.flags.reset){
            //maze reset complete
            if(this.state.maze.mazeIndex === this.state.objects.deRendered.length){
                console.log("Maze reset complete");

                //reset flags
                this.state.flags.reset = false;
                this.state.flags.generate = false;
                this.state.flags.solve.dfs = false;
                this.state.flags.solve.bfs = false;

                //reset dfs and bfs
                this.state.maze.dfs.getOrder = false;
                this.state.maze.dfs.dfsOrder = [];
                this.state.maze.dfs.dfsIndex =  0;
                this.state.maze.dfs.isSolved =  false;

                this.state.maze.bfs.getOrder = false;
                this.state.maze.bfs.bfsOrder = [];
                this.state.maze.bfs.bfsIndex =  0;
                this.state.maze.bfs.isSolved =  false;

                //re-emable solving buttons
                this.state.buttons.solve.dfs.disabled = false;
                this.state.buttons.solve.bfs.disabled = false;

                //re-enable generation
                this.state.buttons.generate.disabled = false;

                //reset the maze index
                this.state.maze.mazeIndex = 0;
            }
            else{
                //only clear the path if its not the end location
                if(this.state.objects.deRendered[this.state.maze.mazeIndex] != this.state.objects.lastWall){
                    this.state.objects.deRendered[this.state.maze.mazeIndex].render = false;
                }
                //the path is no longer visited
                this.state.objects.deRendered[this.state.maze.mazeIndex].visited = false;
                this.state.maze.mazeIndex++;
            }
        }

        //create the new maze
        if(this.state.flags.generate){
    
            //first clear the maze if it is already generated
            if(this.state.maze.needsClearing){
                //change the last spot back to the wall colour
                this.state.objects.lastWall.material.diffuse = vec3.fromValues(0.0, 0.0, 1.0);
                //re-render wall, change its colour and remove it from the de-rendered list
                if(this.state.objects.deRendered.length > 0){
                    this.state.objects.deRendered[this.state.objects.deRendered.length - 1].material.diffuse = vec3.fromValues(0.0, 0.0, 1.0);
                    this.state.objects.deRendered[this.state.objects.deRendered.length - 1].render = true;
                    this.state.objects.deRendered[this.state.objects.deRendered.length - 1].isPath = false;
                    this.state.objects.deRendered.pop();
                }
                //maze is completley cleared
                else{
                    this.state.objects.deRenderedIndex = 0;
                    this.state.maze.needsClearing = false;
                }
               
            }
            else{
                //create the maze if neccessary
                if(this.state.maze.needsGenerating){
                    this.generateMaze();
                    //dont want to re-generate the maze every frame
                    this.state.maze.needsGenerating = false;
                }
            
                //visualize the maze
                else{
                    //visualization complete
                    if(this.state.objects.deRenderedIndex === this.state.objects.deRendered.length){
                        console.log("Maze Generation Complete");

                        //re-render the last wall, making it the solve location
                        this.state.objects.lastWall.render = true;
                        this.state.objects.lastWall.material.diffuse = vec3.fromValues(1.0, 0.0, 0.0);

                        //since the maze is completly visualized, we can now clear it
                        this.state.maze.needsClearing = true;

                        //enable the generation button
                        this.state.buttons.generate.disabled = false;

                        //dont want to re-generate the maze
                        this.state.flags.generate = false;

                        //re-enable the solving buttons
                        this.state.buttons.solve.bfs.disabled = false;
                        this.state.buttons.solve.dfs.disabled = false;
                    }
                    //visualize next path
                    else{
                        this.state.objects.deRendered[this.state.objects.deRenderedIndex].render = false;
                        this.state.objects.deRenderedIndex++;
                    }
                }
            }
        }

        //perform dfs solution
        if(this.state.flags.solve.dfs){

            //perform the dfs-recursive maze solving algorithim
            if(!this.state.maze.dfs.getOrder){
                //gets the ordering of the dfs search
                this.depthFirstSearch(this.state.maze.start);
                //only want to do this once
                this.state.maze.dfs.getOrder = true;
            }

            //maze is solved, stop visualizing
            if(this.state.maze.dfs.isSolved){
                console.log("DFS Complete");

                //maze is no longer solved
                this.state.maze.dfs.isSolved = false;
                //re-enable the reset button
                this.state.buttons.reset.disabled = false;
                //dont want to keep visualizing dfs
                this.state.flags.solve.dfs = false;
            }

            //visualize the result of the dfs-solution
            else{
                //get the current path from the dfs solution
                var currPath = this.state.maze.dfs.dfsOrder[this.state.maze.dfs.dfsIndex];
                //if its the last wall, stop visualizing
                if(currPath === this.state.objects.lastWall){
                    this.state.maze.dfs.isSolved = true;
                }
                //otherwise re-render the wall and increase the index of the dfs order
                else{
                    currPath.render = true;
                    this.state.maze.dfs.dfsIndex++;
                }

               
                
            }
        }

        //perform bfs solution
        if(this.state.flags.solve.bfs){
            //perform bfs maze solving algorithim
            if(!this.state.maze.bfs.getOrder){
                //gets the bfs ordering
                this.breadthFirstSearch();
                //only need to do this once
                this.state.maze.bfs.getOrder = true;
            }

            //stop visualizing, maze is solved
            if(this.state.maze.bfs.isSolved){
                console.log("BFS Compelete");

                //maze is no longer solved
                this.state.maze.bfs.isSolved = false;
                //re-enable the reset button
                this.state.buttons.reset.disabled = false;
                //dont want to keep visualizing
                this.state.flags.solve.bfs = false;
            }

            //visualize bfs
            else{
                //get the current path from the bfs ordering
                var currPath = this.state.maze.bfs.bfsOrder[this.state.maze.bfs.bfsIndex];
                //if its the last wall, stop 
                if(currPath === this.state.objects.lastWall){
                    this.state.maze.bfs.isSolved = true;
                }
                //otherwise re-render it and increase the bfs index
                else{
                    currPath.render = true;
                    this.state.maze.bfs.bfsIndex++;
                }
            }

        }
        //console.log(this.state.camera.front);

        //move camera and get the view matrix
        this.state.camera.move(deltaTime);
        //console.log(this.state.camera.position);
        let viewMatrix = mat4.create();
        let front = vec3.create();
        vec3.add(front, this.state.camera.position, this.state.camera.front);
        mat4.lookAt(
            viewMatrix,
            this.state.camera.position,
            front,
            this.state.camera.up,
        );

        //setup projection matrix
        let projectionMatrix = mat4.create();
        mat4.perspective(
            projectionMatrix, 
            degToRad(45.0),
            this.state.canvas.clientWidth / this.state.canvas.clientHeight,
            0.1, 
            100.0
        );

       //update global uniforms
       this.state.context.useProgram(this.state.shader.program);
       this.state.shader.setMat4(this.state.shader.info.uniformLocations.view, viewMatrix);
       this.state.shader.setMat4(this.state.shader.info.uniformLocations.projection, projectionMatrix);

       var sceneLight = this.state.objects.lights[0];
       this.state.shader.setVec3(this.state.shader.info.uniformLocations.cameraPos, this.state.camera.position);

       this.state.shader.setVec3(this.state.shader.info.uniformLocations.lightColour, sceneLight.colour);
       this.state.shader.setVec3(this.state.shader.info.uniformLocations.lightPosition, sceneLight.position);
       this.state.shader.setFloat(this.state.shader.info.uniformLocations.lightStrength, sceneLight.strength);
       this.state.shader.setFloat(this.state.shader.info.uniformLocations.lightN, sceneLight.nVal);
    }

    //render calls go here
    onRender(){
        //render the plane to the screen
        this.state.objects.plane.draw();

        //render the cubes
        
        this.state.objects.cubes.forEach(cube => {
            if(cube.render){
                cube.draw();
            }
        })
        
       
    }

    //start of the frame, things that happen before the 
    //frame is updated go here
    startFrame(){
        this.state.context.clearColor(0.5, 0.5, 0.5, 1.0);
        this.state.context.clearDepth(1.0);
        this.state.context.enable(this.state.context.DEPTH_TEST);
        this.state.context.clear(this.state.context.COLOR_BUFFER_BIT | this.state.context.DEPTH_BUFFER_BIT);
        this.state.context.depthFunc(this.state.context.LEQUAL);
    }

    //end of the frame, can add post processing here
    endFrame(){

    }


       


    generateMaze(){

         //generate maze
         while(this.state.objects.wallList.length != 0){
            //get a random number between 0 and length of the wall list
            var index = Math.floor(Math.random() * (this.state.objects.wallList.length));
            var wall = this.state.objects.wallList[index]
            
            //get the last selected wall
            this.state.objects.lastWall = wall;

            //neighbours for wach wall
            var neighours = 0;

            //if a neighbour exists and its a wall, increase neighbour count
            wall.neighbours.forEach(n => {
                if(n){
                    if(!n.isPath){
                        neighours++;
                    }
                }
            })

            //only create a path if it has 3 or more adjacent walls
            if(neighours >= 3){
                //de-render the wall, make it a path and add it the de-rendered list
                wall.isPath = true;
                this.state.objects.deRendered.push(wall);
                //add each neigbour of the current path to the wall list
                wall.neighbours.forEach(n => {
                    this.state.objects.wallList.push(n);
                })
            }

            //remove the current path from the wall list
            var index = this.state.objects.wallList.indexOf(wall);
            this.state.objects.wallList.splice(index, 1);
        }

    }

    depthFirstSearch(startPos){
        shuffle(startPos.neighbours);
        startPos.neighbours.forEach(n => {
            if(n === this.state.objects.lastWall){
                this.state.maze.dfs.dfsOrder.push(n);
            }
            //if the current cell is a 
            if(!n.render && !n.visited){
                n.material.diffuse = this.state.maze.dfs.colour;
                n.visited = true;
                this.state.maze.dfs.dfsOrder.push(n);
                this.depthFirstSearch(n);
            }
        
        })
    }

    breadthFirstSearch(){
        var queue = new Queue();
        queue.enqueue(this.state.maze.start);

        while(!queue.isEmpty){
            var curr = queue.dequeue();
            if(!curr){
                continue;
            }
            this.state.maze.bfs.bfsOrder.push(curr);
            shuffle(curr.neighbours);
            curr.neighbours.forEach(n => {
                if(n === this.state.objects.lastWall){
                    this.state.maze.bfs.bfsOrder.push(n);
                }
                if(!n.render && !n.visited){
                    n.material.diffuse = this.state.maze.bfs.colour;
                    n.visited = true;
                    queue.enqueue(n);
                }
            })
        }
    }
}

function shuffle(array){
    for(var i = array.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
