import { expect } from 'chai';
import { MyModule } from './mymodule';

describe('MyModule tests', () => {
  it('add should work', () => {
    const myModule = new MyModule();
    expect(myModule.value).to.equal(0);
    myModule.add(1);
    expect(myModule.value).to.equal(1);
  });
});
