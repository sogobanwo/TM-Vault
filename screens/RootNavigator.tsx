import { createStackNavigator } from "@react-navigation/stack"
import DepositModal from "../components/DepositModal"
import WithdrawModal from "../components/WithdrawModal"
import TabNavigator from "./TabNavigator"

const Stack = createStackNavigator()

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" component={TabNavigator} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="deposit" component={DepositModal} />
        <Stack.Screen name="withdraw" component={WithdrawModal} />
      </Stack.Group>
    </Stack.Navigator>
  )
}

