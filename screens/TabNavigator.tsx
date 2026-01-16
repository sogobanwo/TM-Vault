import { Ionicons } from "@expo/vector-icons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useColorScheme } from "nativewind"
import HomeScreen from "./HomeScreen"
import PortfolioScreen from "./PortfolioScreen"

const Tab = createBottomTabNavigator()



export default function TabNavigator() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === "dark"
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#FDC700" : "#d97706",
        tabBarInactiveTintColor: isDark ? "#71717a" : "#9ca3af",
        tabBarStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff", // zinc-950
          borderTopColor: isDark ? "#27272a" : "#e5e7eb", // zinc-800
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="portfolio"
        component={PortfolioScreen}
        options={{
          title: "Portfolio",
          tabBarLabel: "Portfolio",
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}
