class Assignment_One_Scene extends Scene_Component {
    // The scene begins by requesting the camera, shapes, and materials it will need.
    constructor(context, control_box) {
        super(context, control_box);

        // First, include a secondary Scene that provides movement controls:
        if(!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

        // Locate the camera here (inverted matrix).
        const r = context.width / context.height;
        context.globals.graphics_state.camera_transform = Mat4.translation([0, 0, -95]);
        context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
        // design.  Once you've told the GPU what the design of a cube is,
        // it would be redundant to tell it again.  You should just re-use
        // the one called "box" more than once in display() to draw
        // multiple cubes.  Don't define more than one blueprint for the
        // same thing here.
        const shapes = {
            'box': new Cube(),
            'ball': new Subdivision_Sphere(4),
            'prism': new TriangularPrism(),
            'rect_prism': new RectanglePrism()
        }
        this.submit_shapes(context, shapes);

        // Make some Material objects available to you:
        this.clay = context.get_instance(Phong_Shader).material(Color.of(.9, .5, .9, 1), {
            ambient: .4,
            diffusivity: .4
        });
        this.plastic = this.clay.override({
            specularity: .6
        });
        
        this.lights = [new Light(Vec.of(10, 10, 20, 1), Color.of(1, .4, 1, 1), 100000)];

        this.blue = Color.of(0, 0, 1, 1);
        this.yellow = Color.of(1, 1, 0, 1);

        this.t = 0;
    }


    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    make_control_panel() {
        this.key_triggered_button("Hover in Place", ["m"], () => {
            this.hover = !this.hover;
        });
        this.key_triggered_button("Pause Time", ["n"], () => {
            this.paused = !this.paused;
        });
    }

    antenna_left(graphics_state, m){

        if (!this.paused) {
            this.t += graphics_state.animation_delta_time / 1000;
        }

        const t = this.t

        const deg = -(0.1 * (1+Math.sin(t))) ;
        let save = m;

        let b;
        let final;

        // for(var j = 0; j < 4; j++){
            m = save = save.times(Mat4.translation([-1,9,0]));


           m =m.times(Mat4.scale([.3,.3,.3]));

            for(var i = 0; i < 9; i++){
                m = m.times(Mat4.translation([-1,1,0])).
                times(Mat4.rotation(deg, Vec.of(3,1,0))).
                times(Mat4.translation([1,1,0]));
            this.shapes.box.draw(
                graphics_state, m, 
                this.clay.override({color: (i%2) ? this.yellow : this.blue})); 
            }

            b = m.times(Mat4.scale([2,2,2])).times(Mat4.translation([0,1.5,0]));

            this.shapes.ball.draw(
                    graphics_state, b, 
                    this.clay.override({color: this.yellow})); 

        // }

    }


    antenna_right(graphics_state, m){

        if (!this.paused) {
            this.t += graphics_state.animation_delta_time / 1000;
        }

        const t = this.t

        const deg = -(0.1 * (1+Math.sin(t))) ;
        let save = m;

        let b;
        let final;

        // for(var j = 0; j < 4; j++){
            m = save = save.times(Mat4.translation([1,9,0]));


           m =m.times(Mat4.scale([.3,.3,.3]));

            for(var i = 0; i < 9; i++){
                m = m.times(Mat4.translation([-1,1,0])).
                times(Mat4.rotation(deg, Vec.of(3,1,0))).
                times(Mat4.translation([1,1,0]));
            this.shapes.box.draw(
                graphics_state, m, 
                this.clay.override({color: (i%2) ? this.yellow : this.blue})); 
            }

            b = m.times(Mat4.scale([2,2,2])).times(Mat4.translation([0,1.5,0]));

            this.shapes.ball.draw(
                    graphics_state, b, 
                    this.clay.override({color: this.yellow})); 

        // }

    }   

    wing_left(graphics_state, m){

        if (!this.paused) {
            this.t += graphics_state.animation_delta_time / 1000;
        }

        const t = this.t

        const flap_deg = -.3 * (1+Math.sin(2*t));




         //wing-tri-left
        this.shapes.prism.draw(
            graphics_state,
            m.times(Mat4.rotation(-flap_deg, Vec.of(0, 1, 0)))
            .times(Mat4.translation(Vec.of(-7,0,0))
            .times(Mat4.rotation(5.49779, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(8.5, 8.5, 1)))),
            this.plastic.override({color: this.yellow}));

         //wing-box #1-left
        this.shapes.box.draw(
            graphics_state,
            m.times(Mat4.rotation(-flap_deg, Vec.of(0, 1, 0)))
            .times(Mat4.translation(Vec.of(-9.5, 6.0, 0)))
            .times(Mat4.rotation(0.785398, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(6, 6, 1))),
            this.plastic.override({color: this.yellow}));

        //wing-box #2-left
        this.shapes.box.draw(
            graphics_state,
            m.times(Mat4.rotation(-flap_deg, Vec.of(0, 1, 0)))
            .times(Mat4.translation(Vec.of(-7, -6, 0)))
            .times(Mat4.rotation(0.785398, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(4.2, 4.2, 1))),
            this.plastic.override({color: this.blue}));

    }


    wing_right(graphics_state, m){

        if (!this.paused) {
            this.t += graphics_state.animation_delta_time / 1000;
        }

        const t = this.t

        const flap_deg = -.3 * (1+Math.sin(2*t));

        //wing-tri-right
        this.shapes.prism.draw(
            graphics_state,
            m.times(Mat4.rotation(flap_deg, Vec.of(0, 1, 0))).times(Mat4.translation(Vec.of(7,0,0)).times(Mat4.rotation(2.35619, Vec.of(0, 0, 1))).times(Mat4.scale(Vec.of(8.5, 8.5, 1)))),
            this.plastic.override({color: this.yellow}));

       
        //wing-box #1-right
        this.shapes.box.draw(
            graphics_state,
            m.times(Mat4.rotation(flap_deg, Vec.of(0, 1 , 0)))
            .times(Mat4.translation(Vec.of(9.5, 6, 0)))
            .times(Mat4.rotation(0.785398, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(6, 6, 1))),
            this.plastic.override({color: this.yellow}));

        

        // //wing-box #2-right
        this.shapes.box.draw(
            graphics_state,
            m.times(Mat4.rotation(flap_deg, Vec.of(0, 1 , 0)))
            .times(Mat4.translation(Vec.of(7, -6, 0)))
            .times(Mat4.rotation(0.785398, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(4.2, 4.2, 1))),
            this.plastic.override({color: this.blue}));


    }

    

    display(graphics_state) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;

        // Variable m will be a temporary matrix that helps us draw most shapes.
        // It starts over as the identity every single frame - coordinate axes at the origin.
        let m = Mat4.identity();
                
        // Find how much time has passed in seconds, and use that to place shapes.
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;

        
        let b;

        const flap_deg = -.3 * (1+Math.sin(3*t));

       //move butterfly into the air
        m = m.times(Mat4.translation(Vec.of(0,0,10)));

        const f = Math.sin(5 * this.t * Math.PI / 4);

        //make it fly
        if (!this.hover){
            m = m.times(Mat4.rotation(.5*t, Vec.of(0, 0, 1)))
                .times(Mat4.translation([0, 0, .5*f]))
                ;
        } 

        //move around circle
        const path = 30+ Math.sin(.5*t);
        m = m.times(Mat4.translation(Vec.of(path, 0, 0)));

        //tilt it up
         m = m.times(Mat4.rotation(Math.PI / 12, Vec.of(1, 0, 0)));



        this.antenna_left(graphics_state, m);

        this.antenna_right(graphics_state, m);

        this.wing_left(graphics_state, m);

        this.wing_right(graphics_state, m);


        //head
        this.shapes.ball.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(0, 8, 0))).times(Mat4.rotation(0, Vec.of(0, 1, 0))).times(Mat4.scale(Vec.of(2, 2, 2))),
            this.clay.override({color: this.blue}));


        //body
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(0, 0, 0))).times(Mat4.rotation(0, Vec.of(0, 1, 0))).times(Mat4.scale(Vec.of(1, 6, 1))),
            this.plastic.override({color: this.blue}));


        //abdomen
        this.shapes.ball.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(0,-12,0)).times(Mat4.scale(Vec.of(1, 6, 1)))),
            this.plastic.override({color: this.blue}));

       

        // *************************** **** LEFT legs **** ***************************

        const leg_deg = -.3 * (Math.abs(Math.sin(t))) ;

        //top leg 1
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(1.5, 4, -3)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(-leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.blue}));

        //bottom leg 1
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(1.5, 4, -7)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.yellow}));



        //top leg 2
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(1.5, -.75, -3)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(-leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.blue}));

        //bottom leg 2
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(1.5, -.75, -7)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.yellow}));


        //top leg 3
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(1.5, -4.75, -3)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(-leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.blue}));

        //bottom leg 3
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(1.5, -4.75, -7)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.yellow}));

        // *************************** **** RIGHT legs **** ***************************

        //top leg 1
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-1, 4, -3)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.blue}));

        //bottom leg 1
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-1, 4, -7)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(-leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.yellow}));


        //top leg 2
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-1, -.75, -3)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.blue}));

        //bottom leg 2
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-1, -.75, -7)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(-leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.yellow}));


        //top leg 3
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-1, -4.75, -3)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.blue}));

        //bottom leg 3
        this.shapes.rect_prism.draw(
            graphics_state,
            m.times(Mat4.translation(Vec.of(-1, -4.75, -7)))
            .times(Mat4.rotation(1.5708, Vec.of(1, 0, 0)))
            .times(Mat4.rotation(-leg_deg, Vec.of(0, 0, 1)))
            .times(Mat4.scale(Vec.of(.5, 2, .5))),
            this.plastic.override({color: this.yellow}));

    }
}




window.Assignment_One_Scene = window.classes.Assignment_One_Scene = Assignment_One_Scene;