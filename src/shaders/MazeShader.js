//vs shader source code
const vsSource = 
`#version 300 es
in vec3 aVertexPosition;
in vec3 aNormal;

uniform mat4 uProjection;
uniform mat4 uTransform;
uniform mat4 uView;
uniform mat4 uNormalMatrix;
uniform vec3 uCameraPos;

out vec3 oNormal;
out vec3 oCameraPos;
out vec3 oFragPos;

void main() {
  gl_Position = uProjection * uView * uTransform * vec4(aVertexPosition, 1.0);
  oNormal = (uNormalMatrix * vec4(aNormal, 0.0)).xyz;
  oFragPos = (uTransform * vec4(aVertexPosition, 1.0)).xyz;
  oCameraPos = uCameraPos;
}
`;

//fs source code
const fsSource = 
`#version 300 es
precision highp float;

in vec3 oNormal;
in vec3 oCameraPos;
in vec3 oFragPos;

uniform vec3 uDiffuseVal;
uniform vec3 uAmbientVal;
uniform vec3 uSpecularVal;
uniform float uLightStr;
uniform float uNval;
uniform vec3 uLightColour;
uniform vec3 uLightPos;

out vec4 oColour;

void main() {
    vec3 normal = normalize(oNormal);
    vec3 lightDir = normalize(uLightPos - oFragPos);
    vec3 viewDir = normalize(oCameraPos - oFragPos);
    vec3 ambient = uAmbientVal * uLightStr * uLightColour;

    vec3 diff = max(dot(lightDir, normal), 0.0) * uLightColour * uLightStr;
    vec3 diffuse = diff * uDiffuseVal;


    //vec3 halfVec = normalize(lightDir + viewDir);
    //float spec = max(dot(halfVec, normal), 0.0);
    //vec3 specular = uSpecularVal * uLightColour * pow(spec, uNval);

    oColour = vec4(ambient + diffuse, 1.0);
  }
`;

class MazeShader extends ShaderProgram{
    constructor(gl){
        super(gl);

        this.init(vsSource, fsSource);

        //bundle the info about the shader program into this variable
        this.info = {
            program: this.program,
            //set any attrib locations here
            attribLocations:{
                vertexPosition: this.gl.getAttribLocation(this.program, "aVertexPosition"),
                normalPosition: this.gl.getAttribLocation(this.program, "aNormal"),
            },
            //set uniforms
            uniformLocations:{
                projection: this.gl.getUniformLocation(this.program, "uProjection"),
                transform: this.gl.getUniformLocation(this.program, "uTransform"),
                view: this.gl.getUniformLocation(this.program, "uView"),
                normalMatrix: this.gl.getUniformLocation(this.program, "uNormalMatrix"),
                cameraPos: this.gl.getUniformLocation(this.program, "uCameraPos"),
                diffuse : this.gl.getUniformLocation(this.program, "uDiffuseVal"), 
                ambient : this.gl.getUniformLocation(this.program, "uAmbientVal"),
                specular : this.gl.getUniformLocation(this.program, "uSpecularVal"),
                lightStrength: this.gl.getUniformLocation(this.program, "uLightStr"),
                lightColour: this.gl.getUniformLocation(this.program, "uLightColour"),
                lightPosition: this.gl.getUniformLocation(this.program, "uLightPos"),
                lightN: this.gl.getUniformLocation(this.program, "uNval"),
            },
        };
    }
}