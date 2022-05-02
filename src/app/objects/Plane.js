class Plane{
    constructor(width, height, gl, shader, colour){
        this.gl = gl;
        this.shader = shader;
        this.width = width;
        this.height = height;
        this.vertices = [
            0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ];
        this.normals = [
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0
        ];
        this.indices = [
            0, 1, 2, 
            0, 2, 3
        ];
        this.material = {
            diffuse: colour,
            ambient: vec3.fromValues(0.1, 0.1, 0.1),
            specular: vec3.fromValues(1.0, 1.0, 1.0)
        };
        this.transform = mat4.create();
        this.normalMatrix = mat4.create();
        this.init();
    }

    scale(vector){
        this.transform = mat4.create();
        mat4.scale(this.transform, this.transform, vector);
    }

    init(){
        
        this.scale(vec3.fromValues(this.width, 0.0, this.height));

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
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

        //good practice to reset the vao once done
        this.gl.bindVertexArray(null);
    }

    draw(){
        this.gl.useProgram(this.shader.program);

        mat4.transpose(this.normalMatrix, this.transform);
        mat4.invert(this.normalMatrix, this.normalMatrix);

        this.shader.setVec3(this.shader.info.uniformLocations.diffuse, this.material.diffuse);
        this.shader.setVec3(this.shader.info.uniformLocations.ambient, this.material.ambient);
        this.shader.setVec3(this.shader.info.uniformLocations.specular, this.material.specular);
        this.shader.setMat4(this.shader.info.uniformLocations.transform, this.transform);
        this.shader.setMat4(this.shader.info.uniformLocations.normalMatrix, this.normalMatrix);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }

   
}