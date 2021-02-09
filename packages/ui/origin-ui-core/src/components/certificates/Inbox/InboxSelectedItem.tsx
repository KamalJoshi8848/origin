import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useOriginConfiguration } from '../../../utils/configuration';
import { EnergyFormatter, LightenColor, useTranslation } from '../../../utils';
import { IInboxCertificateData, IInboxItemData } from './InboxItem';
import { DeviceIcon } from '../../DeviceIcon';
import { Button, IconButton, TextField } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { BigNumber } from 'ethers';

export function InboxSelectedItem(props: {
    cert: IInboxCertificateData;
    device: IInboxItemData;
    setEnergy: (value: BigNumber) => void;
}): JSX.Element {
    const { cert, device, setEnergy } = props;
    const configuration = useOriginConfiguration();

    const { MAIN_BACKGROUND_COLOR, SIMPLE_TEXT_COLOR, PRIMARY_COLOR } = configuration?.styleConfig;

    const useStyles = makeStyles({
        item: {
            padding: '16px',
            marginBottom: '10px',
            background: LightenColor(MAIN_BACKGROUND_COLOR, 1)
        },

        top: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },

        icon: {
            width: 32,
            height: 32,
            color: LightenColor(PRIMARY_COLOR, 3),
            marginRight: '25px'
        },

        text_1: {
            fontSize: '16px',
            color: SIMPLE_TEXT_COLOR
        },

        text_2: {
            fontSize: '14px',
            color: SIMPLE_TEXT_COLOR
        },

        text_3: {
            fontSize: '12px',
            color: SIMPLE_TEXT_COLOR,
            opacity: '.5'
        },

        editButton: {
            marginLeft: '11px'
        },

        form: {
            marginTop: '18px',
            display: 'flex'
        }
    });

    const classes = useStyles();

    const [editMode, setEditMode] = useState(false);
    const [MWhValue, setMWh] = useState<number>(cert.energy.toNumber());
    const { t } = useTranslation();

    function saveForm() {
        setEnergy(BigNumber.from(MWhValue));
    }

    return (
        <div className={classes.item}>
            <div className={classes.top}>
                <DeviceIcon type={device.type} className={classes.icon} />
                <div style={{ flex: '1' }}>
                    <div className={classes.text_3}>{cert.id}</div>
                    <div className={classes.text_1}>{device.name}</div>
                </div>

                {!editMode && (
                    <div className={classes.text_2}>
                        {EnergyFormatter.format(cert.energy, true)}
                    </div>
                )}

                {!editMode && (
                    <IconButton
                        className={classes.editButton}
                        size={'small'}
                        onClick={(event) => {
                            event.preventDefault();
                            setEditMode(true);
                        }}
                    >
                        <EditIcon color={'primary'} />
                    </IconButton>
                )}

                {editMode && (
                    <Button
                        className={classes.editButton}
                        size={'small'}
                        onClick={(event) => {
                            event.preventDefault();
                            setEditMode(false);
                        }}
                    >
                        <span>{t('certificate.actions.cancel')}</span>
                    </Button>
                )}
            </div>
            {editMode && (
                <div className={classes.form}>
                    <TextField
                        type={'number'}
                        style={{ flex: '1', marginRight: '10px', background: '#292929' }}
                        value={MWhValue}
                        aria-valuemin={1}
                        aria-valuemax={cert.maxEnergy.toNumber()}
                        onChange={(event) => setMWh(parseInt(event.target.value, 10))}
                    />
                    <Button color="primary" variant="contained" size="small" onClick={saveForm}>
                        {t('certificate.actions.save')}
                    </Button>
                </div>
            )}
        </div>
    );
}
