import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import BigNumber from 'bignumber.js';
import get from 'lodash/get';
import ReactGA from 'react-ga4';
import ReactModal from 'react-modal';
import { useModal } from 'react-modal-hook';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { balanceOfNative } from '@/actions/accounts';
import {
  delegate,
  getBlockNumber,
  getBlockRewardAmount,
  getOldValidators,
  getTotalStakeAmount,
  getValidators,
  withdraw,
} from '@/actions/consensus';
import { switchNetwork } from '@/actions/network';
import blockCubeIcon from '@/assets/images/block_cude.svg';
import briefcaseIcon from '@/assets/images/briefcase-check.svg';
import metricIcon from '@/assets/images/metric.svg';
import InfoBox from '@/components/common/InfoBox';
import LargeInfoBox from '@/components/common/LargeInfoBox';
import Tabs from '@/components/Tabs';
import ValidatorsList from '@/components/ValidatorsList';
import useInterval from '@/hooks/useInterval';
import {
  formatWeiToNumber,
  toWei,
} from '@/utils/format';
import { networkIds } from '@/utils/network';

export default ({ handleConnect }) => {
  const dispatch = useDispatch()
  const { accountAddress, blockNumber = 0, networkId } = useSelector(state => state.network)
  const { totalStakeAmount } = useSelector(state => state.consensus)
  const accounts = useSelector(state => state.accounts)
  const balance = get(accounts, [accountAddress, 'balanceOfNative'], 0)
  const { validator } = useSelector(state => state.screens.stake)
  const validators = useSelector(state => state.entities.validators)
  const yourStake = get(validators, [validator, 'yourStake'], 0)

  const myTotal = useMemo(() => Object.values(validators).reduce((accumulator, { yourStake }) => accumulator.plus(new BigNumber(yourStake ?? 0)), new BigNumber(0)), [validators])

  const [modalStatus, setModalStatus] = useState(false)

  useEffect(() => {
    dispatch(getValidators())
    dispatch(getOldValidators())
  }, [])

  const [showModal] = useModal(() => (
    <ReactModal isOpen={modalStatus} overlayClassName='modal__overlay' className='modal__content'>
      <div className='info-modal'>
        <div className='title'>
          Unsupported network
        </div>
        <div className='text'>
          Click on the button below to switch to DynoChain
        </div>
        <button
          className='close'
          onClick={() => {
            dispatch(switchNetwork(networkIds.DND))
          }}
        >
          Switch to DynoChain
        </button>
      </div>
    </ReactModal>
  ), [modalStatus])

  useEffect(() => {
    if (accountAddress) {
      dispatch(balanceOfNative(accountAddress))
    }
  }, [accountAddress, networkId])

  useEffect(() => {
    if (networkId) {
      if (accountAddress) {
        dispatch(balanceOfNative(accountAddress))
      }
      dispatch(getTotalStakeAmount())
      dispatch(getBlockRewardAmount())
      dispatch(getBlockNumber())
      if (networkId !== 122) {
        showModal()
        setModalStatus(true)
      }
      if (networkId === 122) {
        setModalStatus(false)
      }
    }
  }, [networkId])

  useInterval(() => {
    dispatch(getBlockNumber())
  }, 10000)

  const onSubmit = ({ amount, submitType }) => {
    if (submitType === 'stake') {
      dispatch(delegate(validator, toWei(amount)))
    } else if (submitType === 'unstake') {
      dispatch(withdraw(validator, toWei(amount)))
    }
    ReactGA.event({
      category: 'action',
      action: `Action - ${submitType}`,
      label: `${submitType} ${amount} into pool: ${get(validators, [validator, 'name'])} ${validator} `
    })
  }

  return (
    <div className='main'>
      <div className='main__content'>
        <div className='boxes'>
          <InfoBox
            name='apy'
            modalText='APY - Annual Percentage Yield (APY) is the estimated yearly yield for tokens locked. Our calculation is " $ locked * (1 year in second)/(total stake in $ * time remaining in seconds).'
            withSymbol={false}
            end={blockNumber}
            title='Block number'
            Icon={() => (
              <img src={blockCubeIcon} />
            )}
          />
          <InfoBox
            name='deposits'
            symbol='DND'
            title='Balance'
            end={formatWeiToNumber(balance)}
            decimals={2}
            Icon={() => (
              <img src={briefcaseIcon} />
            )}
          />
          <LargeInfoBox
            name='rewards'
            symbol='DND'
            end={isNaN(formatWeiToNumber(myTotal)) ? 0 : formatWeiToNumber(myTotal)}
            secondEnd={isNaN(formatWeiToNumber(totalStakeAmount)) ? 0 : formatWeiToNumber(totalStakeAmount)}
            title='Your total staked'
            decimals={2}
            secondTitle='Total staked'
            Icon={() => (
              <img src={metricIcon} />
            )}
          />
        </div>
        <ValidatorsList />
      </div>
      <Tabs handleConnect={handleConnect} yourStake={yourStake} balance={balance} onSubmit={onSubmit} />
    </div>
  )
}
