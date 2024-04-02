/**
 * @zh
 *   Gizmo 有许多公共配置，所有可能需要更改或者变化的数据都在这个文件内配置
 * 
 * @en
 *    There are many common configurations for gizmo, all the data that needs to be changed or changed is configured in this file
 */

import { Color } from 'cc';

export const COLOR = {
    NORMAL: new Color(0, 255, 0, 100),
    SELECTED: new Color(255, 255, 0, 100),

    // @zh 没有颜色、透明
    // @en No color, transparent
    NONE: new Color(0, 0, 0, 0),
    // @zh 弱化的颜色
    // @en Weakened color
    WEAK: new Color(0, 0, 0, 80),

    X: new Color(255, 0, 0, 255),
    Y: new Color(0, 255, 0, 255),
    Z: new Color(0, 0, 255, 255),
};
