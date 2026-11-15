const brand = {
  hero:'#292457',heroText:'#FFFFFF',heroMuted:'#D3D0E9',heroEyebrow:'#B7B1FF',
  heroHint:'#C2BDDE',heroAccent:'#C5F284',onHeroAccent:'#292457',
  successButton:'#21835B',onSuccess:'#FFFFFF',dangerButton:'#B92E4B',onDanger:'#FFFFFF',
};
export const palettes = {
  light:{...brand,primary:'#5145CD',onPrimary:'#FFFFFF',background:'#F6F7FB',surface:'#FFFFFF',
    text:'#20203A',muted:'#68687E',border:'#E7E7F0',danger:'#B92E4B',
    primarySurface:'#EEECFF',chip:'#E8E8F0',success:'#21835B',successSurface:'#E9F7EF'},
  dark:{...brand,hero:'#25203E',primary:'#B6AAFF',onPrimary:'#21183D',background:'#11121C',surface:'#1C1D2D',
    text:'#F0EFF8',muted:'#AEACC0',border:'#353449',danger:'#FF8A9B',
    primarySurface:'#302A4B',chip:'#29283D',success:'#7EDDB3',successSurface:'#183B30'},
};
export const categories = ['All', 'Education', 'Graphic Design', 'Programming', 'Photography', 'Documentation', 'Multimedia', 'Delivery'];
export const categoryIcons = { Education: 'school-outline', 'Graphic Design': 'color-palette-outline', Programming: 'code-slash-outline', Photography: 'camera-outline', Documentation: 'document-text-outline', Multimedia: 'videocam-outline', Delivery: 'bicycle-outline' };
