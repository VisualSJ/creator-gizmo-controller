/**
 * Gizmo 使用的工具组件
 * 动态的设置节点的 rotation，十节点始终朝向用户
 */

import { _decorator, Component, find, Vec3, Quat, Node } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('editor_gizmo_tool_face_camera')
@executeInEditMode
export class editor_gizmo_tool_face_camera extends Component {
    private _tempQuat_a = new Quat();

    @property({
        type: Node,
    })
    private list: Node[] = [];

    update() {
        const node = find('Editor Scene Background/Editor Camera');

        // @zh 始终让控制点朝向摄像机
        // @en Always make the control point face the camera
        node.getWorldRotation(this._tempQuat_a);
        this.list.forEach((node) => {
            node.setWorldRotation(this._tempQuat_a);
        });
    }
}

