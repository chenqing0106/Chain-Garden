// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// 使用 as 关键字给导入的合约起个别名，避免命名冲突
import {ERC1967Proxy as BaseProxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// 合约名必须叫 ERC1967Proxy，这样生成的 JSON 文件名才是脚本想要的
contract ERC1967Proxy is BaseProxy {
    constructor(address _logic, bytes memory _data) payable BaseProxy(_logic, _data) {}
}