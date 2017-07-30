# Talk.js
A library for messaging between [isolated worlds](https://developer.chrome.com/extensions/content_scripts#execution-environment), useful in chrome extensions
> **Caution:** APIs here are not stable and may change at any time, so don't use it in production

# Hello World (Async ver.)
## content script
```javascript
const content = new Talk('content', (message, sender) => {
    console.log(`content received: "${message}" from ${sender}`);
    return `Hello, ${sender}!`;
});
content.greet();
```
## page script
```javascript
const page = new Talk('page', (message, sender) => {
    console.log(`page received: ${message} from ${sender}`);
    if (message === 'How are you?') throw `I'm not feeling well`;
});
await page.wait('content');
console.log(await page.ask('content', 'Hello, content!'));
// content received: "Hello, content!" from page
// Hello, page!
```
## user script (or maybe another extension)
```javascript
const userjs = new Talk('userjs');
await userjs.wait(['content', 'page']);
userjs.broadcast('Hello, everyone!');
// content received: "Hello, everyone!" from userjs
// page received: "Hello, everyone!" from userjs
// * The order of the two messages above is determined by constructing order
try {
    await userjs.ask('page', 'How are you?');
    // page received: "How are you?" from userjs
} catch (e) {
    console.log(e);
    // Error: I'm not feeling well
    userjs.tell('page', `I'm sorry to hear that.`);
    // page received: "I'm sorry to hear that." from userjs
}
```

# APIs 

## Construction
### new Talk(name[, handler]) ⇒ `talk`
```typescript
new Talk(name:string, handler = (message:transferable, sender:string) => returnValue:transferable): talk
```
`name` should be unique and will be used for messaging

`handler` is responsible for taking `message` from `sender` and return/throw a `transferable` back

## Ensuring loaded

> **Suggestion:** Only use these APIs when you aren't sure about loading order

### Talk#greet()
Declare that I'm present
### Talk#wait(sb:string) ⇒ `promise`
Wait for somebody
### Talk#wait([sb1:string, sb2:string, ...]) ⇒ `promise`
Batch version of `Talk#wait()`

> **Tips:** When you call `Talk#wait()`, you will greet to others internally, so you needn't call `Talk#greet()`

## Messaging (Sync version, based on `dispatchEvent`)

> **IMPORTANT:** In Sync version, messaging APIs are sync, but `Talk#wait()` is async, because we don't know when it will present

### Talk#ask(sb:string, sth:transferable) ⇒ `transferable`
Call `sb`'s `handler` synchronously with `sth` and get its return value
If `handler` throw an `error` or a `transferable`, throw it
### Talk#tell(sb:string, sth:transferable)
Call `sb`'s `handler` synchronously with `sth`
### Talk#broadcast(sth:transferable)
Call all `handler`s synchronously with `sth`

## Messaging (Async version, based on `postMessage`)

> **Information:** The `transfer` here is the same as `transfer` in `postMessage`

### Talk#ask(sb:string, sth:transferable[, transfer:array]) ⇒ `promise[[PromiseValue]]:transferable`
Call `sb`'s `handler` asynchronously with `sth` and get its return value wrapped in a `promise`

If `handler` throw an `error` or a `transferable`, the `promise` will be rejected with it
### Talk#tell(sb:string, sth:transferable[, transfer:array])
Call `sb`'s `handler` asynchronously with `sth`
### Talk#broadcast(sth:transferable[, transfer:array])
Call all `handler`s asynchronously with `sth`

# References
* To read more about `transferable`, see: <https://mdn.io/Structured_clone_algorithm>
* To read more about `transfer`, see: <https://mdn.io/postMessage>