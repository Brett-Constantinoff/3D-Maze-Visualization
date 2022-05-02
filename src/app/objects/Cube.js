class Cube{
    constructor(name, gl, shader, colour){
        this.name = name;
        this.gl = gl;
        this.shader = shader;
        this.vertices = [
            0.0, 0.0, 0.0,
            0.0,1.0, 0.0,
           1.0,1.0, 0.0,
           1.0, 0.0, 0.0,

            0.0, 0.0,1.0,
            0.0,1.0,1.0,
           1.0,1.0,1.0,
           1.0, 0.0,1.0,

            0.0,1.0,1.0,
            0.0,1.0, 0.0,
           1.0,1.0, 0.0,
           1.0,1.0,1.0,

            0.0, 0.0,1.0,
           1.0, 0.0,1.0,
           1.0, 0.0, 0.0,
            0.0, 0.0, 0.0,

           1.0, 0.0,1.0,
           1.0, 0.0, 0.0,
           1.0,1.0,1.0,
           1.0,1.0, 0.0,

            0.0, 0.0,1.0,
            0.0, 0.0, 0.0,
            0.0,1.0,1.0,
            0.0,1.0, 0.0
        ];
        this.normals = [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            

            -1.0, 0.0, 0.0, 
            -1.0, 0.0, 0.0, 
            -1.0, 0.0, 0.0, 
            -1.0, 0.0, 0.0, 

            1.0, 0.0, 0.0, 
            1.0, 0.0, 0.0, 
            1.0, 0.0, 0.0, 
            1.0, 0.0, 0.0, 

        ];
    
        this.indicies = [
            //front face
            2, 0, 1, 
            3, 0, 2,
            //backface
            5, 4, 6, 
            6, 4, 7,
            //top face
            10, 9, 8, 
            10, 8, 11,
            //bottom face
            13, 12, 14, 
            14, 12, 15,
            //side
            18, 16, 17, 
            18, 17, 19,
            //side
            22, 21, 20, 
            23, 21, 22,
        ];
        this.render = true;
        this.isPath = false;
        this.visited = false;
        this.material = {
            diffuse: colour,
            ambient: vec3.fromValues(0.1, 0.1, 0.1),
            specular: vec3.fromValues(1.0, 1.0, 1.0)
        };
        this.neighbours = [];
        this.position = vec3.create();
        this.transform = mat4.create();
        this.normalMatrix = mat4.create();
        this.init();
    }

    init(){


        //create and generate objects vao
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        //buffer for vertex positions
        let vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(
            this.shader.info.attribLocations.vertexPositions,
            3,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.enableVertexAttribArray(this.shader.info.attribLocations.vertexPositions);

        //buffer for normals
        let normalVbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalVbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(
            this.shader.info.attribLocations.normalPosition,
            3,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.enableVertexAttribArray(this.shader.info.attribLocations.normalPosition);
        
        //buffer for indexed drawing
        let ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicies), this.gl.STATIC_DRAW);
        
        //good practice to reset the vao once done
        this.gl.bindVertexArray(null);
    }



    translate(translation){
        vec3.add(this.position, this.position, translation);
        mat4.translate(this.transform, this.transform, this.position);
    }

    draw(){
        this.gl.useProgram(this.shader.program);

        mat4.transpose(this.normalMatrix, this.transform);
        mat4.invert(this.normalMatrix, this.normalMatrix);

        this.shader.setMat4(this.shader.info.uniformLocations.normalMatrix, this.normalMatrix);
        this.shader.setVec3(this.shader.info.uniformLocations.diffuse, this.material.diffuse);
        this.shader.setVec3(this.shader.info.uniformLocations.ambient, this.material.ambient);
        this.shader.setVec3(this.shader.info.uniformLocations.specular, this.material.specular);
        this.shader.setMat4(this.shader.info.uniformLocations.transform, this.transform);

    
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.indicies.length, this.gl.UNSIGNED_SHORT, 0)
        this.gl.bindVertexArray(null);
    }
}