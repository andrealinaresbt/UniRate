import { useNavigation } from '@react-navigation/native';

export default function CourseScreen() {
  const navigation = useNavigation();

  return (
    <Button
      title="Go Home"
      onPress={() => navigation.navigate('Home')}
    />
  );
}
