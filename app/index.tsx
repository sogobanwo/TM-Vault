import { useAccount } from "wagmi"
import RootNavigator from "../screens/RootNavigator"


export default function Index() {
  const { isConnected } = useAccount()

  // No conditional redirect


  return <RootNavigator />
}
