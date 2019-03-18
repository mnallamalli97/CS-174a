class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
    getPoint(t) {
        return this.origin.plus(this.direction.times(t));
    }
}

class PixelBuffer {
    constructor(width, height) {
        if (width instanceof ImageData)
            this.imgdata = width; // passed in existing ImageData
        else {
            this.imgdata = new ImageData(width, height);
        }
    }
    width() {
        return this.imgdata.width;
    }
    height() {
        return this.imgdata.height;
    }
    coord(x, y) {
        return y * (this.imgdata.width * 4) + x * 4;
    }
    getColor(x, y) {
        const r = this.coord(x, y);
        return Color.from([0, 1, 2, 3].map(i => this.imgdata[r + i] / 255));
    }
    setColor(x, y, color) {
        const r = this.coord(x, y);
        for (let i = 0; i < 4; ++i) {
            let comp = (color.length <= i) ? 1 : color[i];
            this.imgdata.data[r + i] = Math.round(255 * Math.min(Math.max(comp, 0), 1));
        }
    }
}

class SimpleRenderer {
    constructor(scene, camera, maxRecursionDepth=1) {
        this.scene = scene;
        this.camera = camera;
        this.maxRecursionDepth = maxRecursionDepth;
    }
    render(img, timelimit=0, callback=false) {
        const img_width = img.width(),
            img_height = img.height(),
            pixel_width = 1 / img_width,
            pixel_height = 1 / img_height;
        
        let timeCounter = 0,
            lastTime = Date.now();

        
        for (let px = 0; px < img_width; ++px) {
            let x = 2 * (px / img_width) - 1;
            for (let py = 0; py < img_height; ++py) {
                
                let y = -2 * (py / img_height) + 1;
                img.setColor(px, py, this.colorPixel(x, y, pixel_width, pixel_height));

                if (timelimit && callback) {
                    let currentTime = Date.now();
                    timeCounter += currentTime - lastTime;
                    lastTime = currentTime;
                    if (timeCounter >= timelimit) {
                        timeCounter = 0;
                        callback();
                    }
                }
            }
        }
        return img;
    }
    colorPixel(x, y, pixel_width, pixel_height) {
        return this.scene.color(this.camera.getRayForPixel(x, y), this.maxRecursionDepth);
    }
}

class Camera {
    constructor(transform) {
        this.transform = transform;
        this.inv_transform = Mat4.inverse(transform);
    }
    getRayForPixel(x, y) {
        throw "getRayForPixel is unimplemented in Camera subclass";
    }
}

class PerspectiveCamera extends Camera {
    constructor(fov, aspect, transform) {
        super(transform);
        this.position = this.transform.column(3);
        this.tan_fov = Math.tan(fov / 2);
        this.aspect = aspect;
    }
    getRayForPixel(x, y) {
        let direction = Vec.of(
            x * this.tan_fov * this.aspect,
            y * this.tan_fov,
            -1, 0);
        return new Ray(this.position, this.transform.times(direction));
    }
}

class Scene {
    constructor(bg_color=Vec.of(0, 0, 0), objects=[], lights=[]) {
        this.bg_color = bg_color;
        this.objects = [];
        this.lights = [];
        this.addObjects(objects);
        for (let l of lights)
            this.addLight(l);
    }
    addObject(obj) {
        this.objects.push(obj);
    }
    addObjects(objs) {
        for (let o of objs)
            this.addObject(o);
    }
    addLight(light) {
        this.lights.push(light);
    }

    // Find the details of the closest intersection of the given ray.
    cast(ray, minTime = 0) {
        let closestTime = Infinity, closestObj = null;
        for (let o of this.objects) {
            let time = o.intersect(ray);
            if (time > minTime && time < closestTime) {
                closestTime = time;
                closestObj = o;
            }
        }
        return { object: closestObj, time: closestTime };
    }
    
    // Compute the color of the given ray in this scene.
    color(ray, recursionDepth, minTime = 0) {
        if (!recursionDepth)
            return this.bg_color;

        const intersection = this.cast(ray, minTime);

        if (intersection.object == null)
            return this.bg_color;

        return intersection.object.color(ray, intersection.time, this, recursionDepth - 1);
    }
}

class Light {
    sample(position) {
        throw "Light subclass has not implemented sample";
    }
}

class SimplePointLight extends Light {
    constructor(position, color) {
        super();
        this.position = position;
        this.color = color;
    }
    sample(sample_position) {
        return {
            direction: this.position.minus(sample_position),
            color: this.color
        };
    }
}

class SceneObject {
    constructor(geometry, material, base_material_data) {
        this.geometry = geometry;
        this.material = material;
        this.base_material_data = base_material_data | {};
    }
    intersect(ray, minTime) {
        return this.geometry.intersect(ray, minTime);
    }
    color(ray, time, scene, recursionDepth) {
        let base_data = Object.assign({
                ray: ray,
                time: time,
                position: ray.getPoint(time)
            }, this.base_material_data);
        let material_data = this.geometry.materialData(ray, time, base_data);
        return this.material.color(material_data, scene, recursionDepth);
    }
}

class Geometry {
    intersect(ray, minTime, maxTime) {
        throw "Geometry subclass nas implemented intersect";
    }
    materialData(ray, scalar, base_data) {
        throw "Geometry subclass has not implemented materialData";
    }
}

class Plane extends Geometry {
    // Construct a plane corresponding to:  0 = normal.dot(p) - delta
    constructor(normal, delta, mdata) {
        super();
        this.normal = normal;
        this.delta = delta;
        this.base_material_data = mdata || {};
    }
    intersect(ray) {
        //convert all to 3d vector space. 
        var normal_vec = this.normal.to3();
        var origin = ray.origin.to3();
        var direction = ray.direction.to3();
        var t;
        //var vec= this.normal.to3();
        //var A = vec[0]

        var point_on_plane_dir = this.normal.dot(ray.direction);
        var point_on_plane_origin = this.normal.dot(ray.origin)
        if(Math.abs(point_on_plane_dir) > 0.000001){
            t = ( this.delta - point_on_plane_origin ) /point_on_plane_dir;
            return t;
        }
        return Infinity;

    }
    materialData(ray, scalar, base_data) {
        return Object.assign(base_data, { normal: this.normal });
    }
}

class Triangle extends Plane {
    constructor(vertices, blend_data) {
        const n = vertices[1].minus(vertices[0])
            .cross(vertices[2].minus(vertices[0])).normalized();
        super(n.to4(0), n.dot(vertices[0]));
        this.vertices = vertices;
        this.blend_data = blend_data || {};
    }
    intersect(ray) {
        // Get the intersection point on that plane that contains this triangle.
        const time = super.intersect(ray);
        const intersection_point = ray.getPoint(time);

        // TODO requirement 2: use the toBarycentric function you have/will implemented
        // below to test whether intersection_point is inside this triangle.

        // TODO requirement 2: use the toBarycentric function you have/will implemented
        // below to test whether intersection_point is inside this triangle.
        var ans = this.toBarycentric(intersection_point);
        ans= ans.to3();

        var coord3 = 1 - ans[0] - ans[1]
        var coord2 = 1 - ans[0] - ans[2]
        var coord1 = 1 - ans[2] - ans[1]
        //basic check to see if wheter in the triangle or not
        //bary coords are weights, depending on where it is in the trianlge, checking the weight to proximity

        //if the poit is outside, then greater than 1 or less than 0. not allowed, so checking if within the trianlge.
        if ((coord3 >= 0 && coord3 <=1)   && (coord2 >= 0 && coord2 <=1 ) && (coord1 >= 0 && coord1 <=1 ) && (ans[0] >= 0 && ans[0] <=1 ) && (ans[1] >= 0 && ans[1] <=1 ) && (ans[2] >= 0 && ans[2] <=1 )) {
            return time;
        }

        return Infinity;
    }
    materialData(ray, scalar, base_data) {
        base_data = super.materialData(ray, scalar, base_data);
        const bary = base_data.bary = this.toBarycentric(base_data.position);
        for (let k in this.blend_data)
            base_data[k] = Triangle.blend(bary, this.blend_data[k]);
        return base_data;
    }
    toBarycentric(p) {
        // TODO requirement 2: compute the barycentric coordinates of point p for this
        // triangle. This should work for any number of dimensions over 2. Consider running
        // barycentric.html to help debug this function.
       //very helpful link: https://gamedev.stackexchange.com/questions/23743/whats-the-most-efficient-way-to-find-barycentric-coordinates
        var vertex_of_vector = this.vertices;

        //subtract the 2nd from 1st, 3rd from 1st, and last vertex is p minus the 1st
        var vertex1 = vertex_of_vector[1].minus(vertex_of_vector[0])
        var vertex2 = vertex_of_vector[2].minus(vertex_of_vector[0])
        var vertex3 = p.minus(vertex_of_vector[0]) 

        //acording to the barycentric formula
        //need to dot vertex1 w/ vertex1
        var dot1 = vertex1.dot(vertex1)
        //vertex1 w/ vertex2
        var dot2 = vertex1.dot(vertex2)
        //vertex2 w/ veertex2
        var dot3 = vertex2.dot(vertex2)
        //verte3 w/ vertex1
        var dot4 = vertex3.dot(vertex1)
        //vertex3 w/ vertex2
        var dot5 = vertex3.dot(vertex2)

        var bottom = dot1*dot3 - dot2*dot2
        var coord1 = (dot3*dot4 - dot2*dot5) / bottom
        var coord2 = (dot1*dot5 - dot2*dot4) / bottom
        var coord3 = 1 - coord1 - coord2
        return Vec.of(coord3, coord1, coord2);
    }
    static blend(bary, data) {
        if (data instanceof Array) {
            if (typeof data[0] === "number")
                return bary[0] * data[0]
                    + bary[1] * data[1]
                    + bary[2] * data[2];
            if (data[0] instanceof Vec)
                return data[0].times(bary[0])
                    .plus(data[1].times(bary[1]))
                    .plus(data[2].times(bary[2]));
        }
        return data;
    }
}

class Material {
    color(data, scene, recursionDepth) {
        throw "Material subclass has not implemented color";
    }
}

class SolidColorMaterial extends Material {
    constructor(color) {
        super();
        this._color = color;
    }
    color(data, scene, recursionDepth) {
        return this._color;
    }
}

class PhongMaterial extends Material {
    constructor(baseColor, ambient=1, diffusivity=0, specularity=0, smoothness=0, reflectivity=0) {
        super();
        this.baseColor = baseColor;         // O
        this.ambient = ambient;             // k_a
        this.diffusivity = diffusivity;     // k_d
        this.specularity = specularity;     // k_s
        this.smoothness = smoothness;       // n
        this.reflectivity = reflectivity;   // K_r
    }

    // This function should return a surface color according to Phong shading.
    // The parameters to this function are as follows:
    //      data: an object constructed in (Plane|Triangle).materialData(...)
    //          data.ray: ray that we are trying to color
    //          data.position: position of intersection we are trying to color
    //          data.normal: normal of surface at intersection (NB: may not be normalized)
    //      scene: the scene in which we are trying to color, useful for shadows and reflections
    //      recursionDepth: the level of recursion we are currently on for this material color
color(data, scene, recursionDepth) {
        // TODO requirement 3: ambient component of phong shading
        
        var color_of_scene = scene.color(data.ray, recursionDepth);
        //need to multiply each c`omponenent with an ambient of phong shading
        var c1 = this.ambient * this.baseColor[0]
        var c2 = this.ambient * this.baseColor[1]
        var c3 = this.ambient * this.baseColor[2]
        var ret = this.baseColor.times(this.ambient);
        var Normal = data.normal.normalized();
        //init the inside colors to be 0 at first, then multiply with reflection
        var darker1 = 0;
        var darker2 = 0;
        var darker3 = 0;
        for (let l of scene.lights) {
            // light_sample, the result of l.sample(...), is an object with the following properties:
            //   light_sample.direction: a vector corresponding to the light's position minus data.position
            //   light_sample.color: the color this light casts in the given direction
            let light_sample = l.sample(data.position);
            let cast = scene.cast(new Ray(data.position, light_sample.direction), 0.00001);

            if (cast.time > 0.0001 && cast.time <=1 ) {continue;}
            if(cast.object != null){continue;}

            var I = light_sample.color;
            var Light = light_sample.direction.normalized()
            
            var d_product = Normal.dot(Light);

            if (this.diffusivity) {
                let difference = light_sample.color.times(this.diffusivity * Normal.dot(Light));
                ret = ret.plus(difference);
            }

            if (this.specularity) {
                var first_m = d_product * 2;
                var big_r = Normal.times(first_m).minus(Light).normalized();

                let special = light_sample.color.times(this.specularity * Math.pow(big_r.dot(data.ray.direction.normalized()), this.smoothness));

                ret = ret.plus(special);
            }

        //     // TODO requirement 4: test whether this light source is shadowed using scene.cast(...)

        //     // TODO requirment 3: diffuse and specular compoents
        //      var insert_ray = new Ray(data.position, big_r)
        //      var color_of_scene = scene.color(insert_ray, recursionDepth)

        //     darker1 += (this.reflectivity * color_of_scene[0])
        //     darker2 += (this.reflectivity * color_of_scene[1])
        //     darker3 += (this.reflectivity * color_of_scene[2])
        // // }

        // c1 += (this.reflectivity * darker1) 
        // c2 += (this.reflectivity * darker2)
        // c3 += (this.reflectivity * darker3)

        // // TODO requirement 5: reflection using scene.color(...)

        // return Vec.of(c1, c2, c3);
    }


    //outside the for loop 
    //need to create array and send that array to scene.color to check for relflection
    //get that return value and those are the colors.  
        if(this.reflectivity){
            var returnn = Normal.times(Normal.dot(data.ray.direction.normalized()) * -2).plus(data.ray.direction.normalized()).normalized();
            ret = ret.plus(scene.color(new Ray(data.position, returnn), recursionDepth, 0.0001).times(this.reflectivity));
        }

    return ret;
}

}



function parseIndices(ts) {
    return ts.slice(1).map(t => t.match(/(\d+)(?:\/(\d*)(?:\/(\d+))?)?/).slice(1).map(x => Number.parseInt(x) - 1));
}

function parseObjFile(data, defaultMaterial, transform=Mat4.identity()) {

    let lines = data.split("\n");

    const norm_transform = Mat4.inverse(transform).transposed();

    let positions = [],
        textures = [],
        normals = [],
        triangles = [],
        currentMaterial = defaultMaterial;

    for (let l of lines) {

        if (/^\s*($|#)/.test(l))
            continue;

        let t = l.match(/\S+/g) || [];

        // face: 3 or more 1 based index triples v/vt/vn corresponding to a planar polygon
        if (t[0] == "f") {
            let indices = parseIndices(t);
            for (let i = 2; i < indices.length; ++i) {
                const abc = [indices[0], indices[i-1], indices[i]];
                let data = {};
                if (abc.every(x => x[1] !== undefined && !isNaN(x[1])))
                    data.UV = abc.map(x => textures[x[1]]);
                if (abc.every(x => x[2] !== undefined && !isNaN(x[2])))
                    data.normal = abc.map(x => normals[x[2]]);
                triangles.push(new SceneObject(
                    new Triangle(abc.map(x => positions[x[0]]), data),
                    currentMaterial));
            }
            continue;
        }

        for (let i = 1; i < t.length; ++i)
            t[i] = Number.parseFloat(t[i]);

        // vertex position: 3-4 floats xyz[w], w defaults to 1
        if (t[0] == "v")
            positions.push(transform.times(Vec.of(t[1], t[2], t[3], (t.length < 5) ? 1 : t[4])));

        // texture: 1-3 floats u[v[w]], optionals default to 0
        else if (t[0] == "vt")
            textures.push(Vec.of(t[1], t[2] || 0, t[3] || 0));

        // normal: 3 floats xyz
        else if (t[0] == "vn")
            normals.push(norm_transform.times(Vec.of(t[1], t[2], t[3], 0)).to4(0).normalized());

        // throw away material, smoothing, group, and parameter data
        else if (t[0] == "mtllib" || t[0] == "usemtl" || t[0] == "s" || t[0] == "o" || t[0] == "g" || t[0] == "vp")
            continue;

        // throw an error if we see something we don't recognize
        else
            throw "Error while attempting to parse obj file on line \"" + l + "\"";

    }

    return triangles;

}

function loadObjFile(filename, defaultMaterial, transform, callback) {
    fetch(filename).then(response => response.text()).then(function(text) {
        callback(parseObjFile(text, defaultMaterial, transform));
    });
}

function loadObjFiles(files, callback, defaultMaterial=null, transform=Mat4.identity()) {
    let toDoCount = files.length;
    let triangle_sets = new Array(files.length).fill(null);
    for (let i = 0; i < files.length; ++i) {
        // wrap this in a new function scope to capture the current index
        (function(i) {
            loadObjFile(
                files[i].filename || files[i],
                files[i].defaultMaterial || defaultMaterial,
                files[i].transform || transform,
                function(obj_triangles) {
                    triangle_sets[i] = obj_triangles;
                    if (--toDoCount === 0)
                        callback(triangle_sets);
                }
            );
        })(i);
    }
}