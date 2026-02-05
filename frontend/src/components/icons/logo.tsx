import { cn } from '@/lib/utils';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
}

const Logo = ({ className, alt, ...props }: LogoProps) => {
    return (
        <img
            alt={alt || 'XIQ'}
            className={cn('object-contain', className)}
            src="/xiq-logo.png"
            {...props}
        />
    );
};

export default Logo;
