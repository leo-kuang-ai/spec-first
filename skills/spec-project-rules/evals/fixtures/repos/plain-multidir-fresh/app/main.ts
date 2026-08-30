import { placeOrder } from '../lib/core/service';
import { fetchGateway } from '../lib/net/gateway';
import { fmtMoney } from '../lib/util/format';
export const boot = () => { fetchGateway(); placeOrder({ id: '1', amount: 9 }); console.log(fmtMoney(9)); };
