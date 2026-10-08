export const ERC20_ABI = [

    "function name() view returns (string)",

    "function symbol() view returns (string)",

    "function decimals() view returns (uint8)",

    "function totalSupply() view returns (uint256)",

    "function balanceOf(address) view returns (uint256)",

    "function allowance(address,address) view returns (uint256)",

    "function approve(address,uint256) returns (bool)"

];


export const ROUTER_ABI = [

    "function factory() external view returns (address)",

    "function WETH() external view returns (address)",

    "function getAmountsOut(uint256,address[]) external view returns (uint256[])",

    "function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) external returns (uint256[])",

    "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) external returns (uint256,uint256,uint256)"

];