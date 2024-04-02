import { _decorator, Component, Node, v3, Color, MeshRenderer } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

import { COLOR } from '../../../utils/config';

@ccclass('editor_gizmo_rotation_controller')
@executeInEditMode
export class editor_gizmo_rotation_controller extends Component {
    private _startRadian = 0;
    private _endRadian = 0;

    @property({
        type: Node,
    })
    private xzm: Node = null;

    @property({
        type: Node,
    })
    private xym: Node = null;

    @property({
        type: Node,
    })
    private yzm: Node = null;

    @property({
        type: Node,
    })
    private xz: Node = null;

    @property({
        type: Node,
    })
    private xy: Node = null;

    @property({
        type: Node,
    })
    private yz: Node = null;

    @property({
        type: Node,
    })
    private arrow: Node = null;

    start() {
        this.init();
        this.bindEvent();
    }

    update(deltaTime: number) {
        // if (this._startRadian !== 0 || this._endRadian !== 0) {

        // }

        // this.xz.
    }

    private init() {
        this.setTourColor(this.xz, COLOR.Y);
        this.setTourColor(this.xy, COLOR.Z);
        this.setTourColor(this.yz, COLOR.X);

        this.setTourColor(this.yzm, COLOR.NONE);
        this.setTourColor(this.xzm, COLOR.NONE);
        this.setTourColor(this.xym, COLOR.NONE);
    }

    private bindEvent() {
        [
            {
                plane: 'xz',
                p: v3(0, 0.8, 0),
                r: v3(0, 0, 0),
                c: COLOR.Y,
            },
            {
                plane: 'xy',
                p: v3(0, 0, 0.8),
                r: v3(90, 0, 0),
                c: COLOR.Z,
            },
            {
                plane: 'yz',
                p: v3(0.8, 0, 0),
                r: v3(0, 0, -90),
                c: COLOR.X,
            },
        ].forEach((data) => {
            this[data.plane + 'm'].on('hoverIn', (event) => {
                event.propagationStopped = true;
                this.setTourColor(this[data.plane], COLOR.SELECTED);
            });
            this[data.plane + 'm'].on('hoverOut', (event) => {
                event.propagationStopped = true;
                this.setTourColor(this[data.plane], data.c);
            });
            this[data.plane + 'm'].on('mouseDown', (event) => {
                event.propagationStopped = true;
                if (this.arrow) {
                    this.arrow.setPosition(data.p);
                    this.arrow.setRotationFromEuler(data.r);
                    this.arrow.active = true;
                }
            });
            this[data.plane + 'm'].on('mouseMove', (event) => {
                event.propagationStopped = true;
                
            });
            this[data.plane + 'm'].on('mouseUp', (event) => {
                event.propagationStopped = true;
                if (this.arrow) {
                    this.arrow.active = false;
                }
            });
        });
    }

    private setTourColor(node: Node, color: Color) {
        if (!node) {
            return;
        }
        const comp = node.getComponent(MeshRenderer);
        comp.material.setProperty('normalColor', color);
    }
}
