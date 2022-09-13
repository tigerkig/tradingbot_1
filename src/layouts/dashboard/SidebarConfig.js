// routes
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import WrapTextIcon from '@mui/icons-material/WrapText';
// import { PATH_DASHBOARD } from '../../routes/paths';
// components
// import Label from '../../components/Label';
import SvgIconStyle from '../../components/SvgIconStyle';

// ----------------------------------------------------------------------

const getIcon = (name) => (
  <SvgIconStyle src={`/static/icons/navbar/${name}.svg`} sx={{ width: '100%', height: '100%' }} />
);

const ICONS = {
  blog: getIcon('ic_blog'),
  cart: getIcon('ic_cart'),
  chat: getIcon('ic_chat'),
  mail: getIcon('ic_mail'),
  user: getIcon('ic_user'),
  word: getIcon('ic_word'),
  kanban: getIcon('ic_kanban'),
  banking: getIcon('ic_banking'),
  calendar: getIcon('ic_calendar'),
  ecommerce: getIcon('ic_ecommerce'),
  analytics: getIcon('ic_analytics'),
  dashboard: getIcon('ic_dashboard'),
  booking: getIcon('ic_booking'),
  legalagreement: getIcon('ic_legal-agreement'),
  blocklimitedword: getIcon('ic_blocklimitedword'),
  settings: getIcon('ic_settings'),
  locks: <LockOpenIcon />,
  exchange: <ChangeCircleIcon />,
  bridge: <AccountTreeIcon />,
  staking: <DeviceHubIcon />,
  wrap: <WrapTextIcon />,
  vote: <HowToVoteIcon />,
  lpFarming: <AccountTreeIcon />
};

const sidebarConfig = [
  // GENERAL
  // ----------------------------------------------------------------------
  // {
  //   subheader: 'general',
  //   items: [
  //     {
  //       title: 'app',
  //       path: PATH_DASHBOARD.general.app,
  //       icon: ICONS.dashboard
  //     }
  //   ]
  // },

  // MANAGEMENT
  // ----------------------------------------------------------------------
  {
    subheader: 'management',
    items: [
      // MANAGEMENT : USER
      // {
      //   title: 'Locks',
      //   icon: ICONS.locks,
      //   children: [
      //     { title: 'Create Lock', path: '/create-lock' },
      //     { title: 'Token Lock', path: '/lock/#token' },
      //     { title: 'Liquidity Lock', path: '/lock/#liquidity' }
      //   ]
      // },
      {
        title: 'Exchange',
        path: 'exchange',
        icon: ICONS.exchange
      },
      {
        title: 'Bridge',
        path: 'bridge',
        icon: ICONS.bridge
      },
      {
        title: 'Staking',
        path: 'staking',
        icon: ICONS.staking
      },
      {
        title: 'Wrap',
        path: 'wrap',
        icon: ICONS.wrap
      },
      {
        title: 'Vote',
        path: 'governance',
        icon: ICONS.vote
      },
      {
        title: 'LP farming',
        path: 'lp-farming',
        icon: ICONS.lpFarming
      }
    ]
  }

  // APP
  // ----------------------------------------------------------------------
  // {
  //   subheader: 'app',
  //   items: [
  //     {
  //       title: 'mail',
  //       path: PATH_DASHBOARD.mail.root,
  //       icon: ICONS.mail,
  //       // info: <Label color="error">2</Label>
  //       children: [{ title: 'List', path: PATH_DASHBOARD.mail.list }]
  //     },
  //     {
  //       title: 'chat',
  //       path: PATH_DASHBOARD.chat.root,
  //       icon: ICONS.chat,
  //       children: [{ title: 'Private', path: PATH_DASHBOARD.chat.private }]
  //     }
  //   ]
  // }
];

export default sidebarConfig;
