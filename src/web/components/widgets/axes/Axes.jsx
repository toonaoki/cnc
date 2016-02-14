import _ from 'lodash';
import pubsub from 'pubsub-js';
import React from 'react';
import i18n from '../../../lib/i18n';
import controller from '../../../lib/controller';
import Toolbar from './Toolbar';
import DisplayPanel from './DisplayPanel';
import ControlPanel from './ControlPanel';
import * as axesSettings from './AxesSettings';
import {
    ACTIVE_STATE_IDLE,
    IMPERIAL_UNIT,
    METRIC_UNIT
} from './constants';

class Axes extends React.Component {
    state = {
        port: '',
        unit: METRIC_UNIT,
        activeState: ACTIVE_STATE_IDLE,
        machinePos: { // Machine position
            x: '0.000',
            y: '0.000',
            z: '0.000'
        },
        workingPos: { // Working position
            x: '0.000',
            y: '0.000',
            z: '0.000'
        }
    };
    controllerEvents = {
        'grbl:status': (data) => {
            this.setState({
                activeState: data.activeState,
                machinePos: data.machinePos,
                workingPos: data.workingPos
            });
        },
        'grbl:parserstate': (parserstate) => {
            let unit = this.state.unit;

            // Imperial
            if (parserstate.modal.units === 'G20') {
                unit = IMPERIAL_UNIT;
            }

            // Metric
            if (parserstate.modal.units === 'G21') {
                unit = METRIC_UNIT;
            }

            if (this.state.unit !== unit) {
                this.setState({ unit: unit });
            }
        }
    };

    componentDidMount() {
        this.subscribe();
        this.addControllerEvents();
    }
    componentWillUnmount() {
        this.unsubscribe();
        this.removeControllerEvents();
    }
    shouldComponentUpdate(nextProps, nextState) {
        return ! _.isEqual(nextState, this.state);
    }
    subscribe() {
        this.pubsubTokens = [];

        { // port
            let token = pubsub.subscribe('port', (msg, port) => {
                port = port || '';
                this.setState({ port: port });

                if (!port) {
                    this.resetCurrentStatus();
                }
            });
            this.pubsubTokens.push(token);
        }
    }
    unsubscribe() {
        _.each(this.pubsubTokens, (token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }
    addControllerEvents() {
        _.each(this.controllerEvents, (callback, eventName) => {
            controller.on(eventName, callback);
        });
    }
    removeControllerEvents() {
        _.each(this.controllerEvents, (callback, eventName) => {
            controller.off(eventName, callback);
        });
    }
    onEdit() {
        axesSettings.show();
    }
    resetCurrentStatus() {
        this.setState({
            activeState: ACTIVE_STATE_IDLE,
            machinePos: { // Machine position
                x: '0.000',
                y: '0.000',
                z: '0.000'
            },
            workingPos: { // Working position
                x: '0.000',
                y: '0.000',
                z: '0.000'
            }
        });
    }
    toFixedUnitString(unit, val) {
        val = Number(val) || 0;
        if (unit === IMPERIAL_UNIT) {
            val = (val / 25.4).toFixed(4);
        }
        if (unit === METRIC_UNIT) {
            val = val.toFixed(3);
        }

        return '' + val;
    }
    render() {
        let { port, unit, activeState, machinePos, workingPos } = this.state;
        let canClick = (!!port && (activeState === ACTIVE_STATE_IDLE));

        machinePos = _.mapValues(machinePos, (pos, axis) => this.toFixedUnitString(unit, pos));
        workingPos = _.mapValues(workingPos, (pos, axis) => this.toFixedUnitString(unit, pos));

        return (
            <div>
                <Toolbar
                    port={port}
                    unit={unit}
                    activeState={activeState}
                />

                <DisplayPanel
                    port={port}
                    unit={unit}
                    activeState={activeState}
                    machinePos={machinePos}
                    workingPos={workingPos}
                />

                <ControlPanel
                    port={port}
                    unit={unit}
                    activeState={activeState}
                    machinePos={machinePos}
                    workingPos={workingPos}
                />
            </div>
        );
    }
}

export default Axes;