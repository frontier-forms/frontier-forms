import { configure } from 'enzyme';
import * as React16Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new React16Adapter() });
